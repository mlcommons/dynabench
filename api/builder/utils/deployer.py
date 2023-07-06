# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.

import base64
import json
import os
import shlex
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import boto3
import botocore
import sagemaker
import yaml
from dynalab_cli.utils import SetupConfigHandler
from sagemaker.model import Model
from sagemaker.predictor import Predictor

from build_config import build_config
from utils.logging import logger


sys.path.append("../api")  # noqa
from models.task import TaskModel  # isort:skip


class ModelDeployer:
    def __init__(self, model):
        logger.info(f"Set up deployer for model {model.endpoint_name}")
        self.model = model
        self.name = model.name
        self.endpoint_name = model.endpoint_name
        self.repository_name = self.endpoint_name.lower()
        self.archive_name = f"archive.{self.endpoint_name}"

        self.rootp = tempfile.TemporaryDirectory(prefix=self.endpoint_name)
        self.root_dir = self.rootp.name

        self.owd = os.getcwd()
        self.env = self.setup_sagemaker_env()

    def parse_s3_uri(self, s3_uri):
        parts = s3_uri.replace("s3://", "").split("/")
        s3_bucket = parts[0]
        s3_path = "/".join(parts[1:])
        s3_dir = os.path.dirname(s3_path)
        endpoint_name = os.path.basename(s3_path).replace(".tar.gz", "")
        return s3_bucket, s3_path, s3_dir, endpoint_name

    def decen_change_s3_bucket_to_config(self, s3_uri):
        parts = s3_uri.replace("s3://", "").split("/")
        s3_path = "/".join(parts[1:])
        decen_task_bucket = build_config["model_s3_bucket"]
        new_s3_uri = f"s3://{decen_task_bucket}/{s3_path}"
        return new_s3_uri

    def load_model(self, s3_uri, decen=False, decen_task_info=None):
        try:
            s3_bucket, s3_path, s3_dir, endpoint_name = self.parse_s3_uri(s3_uri)
            assert (
                endpoint_name == self.endpoint_name
            ), f"Model at S3 path mismatches model endpoint name"
            logger.info(f"Fetching model folder {s3_path} for {self.name}")
            self._fetch_folder(s3_bucket, s3_path)
            logger.info(f"{self.name} folder loaded temporarily at {self.root_dir}")
            logger.info("Load the model setup config")
            config_handler = SetupConfigHandler(self.name)
            config = config_handler.load_config()
            if decen:
                assert decen_task_info is not None
                logger.info("Decen task ... parsing task from message")
                task_decoded = json.loads(decen_task_info)
                task_code = task_decoded["task_code"]
                annotation_config = yaml.load(
                    task_decoded["config_yaml"], yaml.SafeLoader
                )
                task_info = {"config": annotation_config, "task": task_code}
                task_info_path = os.path.join(self.root_dir, f"{task_code}.json")
                with open(task_info_path, "w+") as f:
                    f.write(json.dumps(task_info, indent=4))
            else:
                self._save_task_info_json(config["task"])
            return config_handler, config, s3_dir
        except AssertionError as ex:
            logger.exception(ex)
            raise RuntimeError(ex)
        except Exception as ex:
            logger.exception(
                f"Exception in fetching model folder and loading config {ex}"
            )
            raise RuntimeError("Exception in fetching model folder and loading config")

    def _fetch_folder(self, s3_bucket, s3_path):
        save_tarball = f"{self.endpoint_name}.tar.gz"
        response = self.env["s3_client"].download_file(s3_bucket, s3_path, save_tarball)
        if response:
            logger.debug(f"Response from fetching S3 folder {response}")

        subprocess.run(shlex.split(f"tar xf {shlex.quote(save_tarball)}"))
        os.remove(save_tarball)

    def _save_task_info_json(self, task_code):
        tm = TaskModel()
        task = tm.getByTaskCode(task_code)
        task_config = yaml.load(task.config_yaml, yaml.SafeLoader)
        task_info = {"config": task_config, "task": task_code}
        task_info_path = os.path.join(self.root_dir, f"{task_code}.json")
        with open(task_info_path, "w+") as f:
            f.write(json.dumps(task_info, indent=4))

    def setup_sagemaker_env(self):
        env = {}
        region = self.config.get("sagemaker_region") or self.config.get("aws_region")
        session = boto3.Session(
            aws_access_key_id=build_config["aws_access_key_id"],
            aws_secret_access_key=build_config["aws_secret_access_key"],
            region_name=region,
        )

        env["region"] = region
        env["account"] = session.client("sts").get_caller_identity().get("Account")

        env["sagemaker_client"] = session.client("sagemaker")
        env["s3_client"] = session.client("s3")
        env["ecr_client"] = session.client("ecr")

        env["sagemaker_session"] = sagemaker.Session(boto_session=session)
        env["bucket_name"] = env["sagemaker_session"].default_bucket()

        env["ecr_registry"] = f"{env['account']}.dkr.ecr.{region}.amazonaws.com"

        return env

    def delete_existing_endpoints(self, sort_order="Ascending", max_results=100):
        # remove endpoint
        endpoint_response = self.env["sagemaker_client"].list_endpoints(
            SortBy="Name",
            SortOrder=sort_order,
            MaxResults=max_results,
            NameContains=self.endpoint_name,
        )
        endpoints = endpoint_response["Endpoints"]
        for endpoint in endpoints:
            if endpoint["EndpointName"] == self.endpoint_name:
                logger.info(f"- Deleting the endpoint {self.endpoint_name:}")
                self.env["sagemaker_client"].delete_endpoint(
                    EndpointName=self.endpoint_name
                )

        # remove sagemaker model
        model_response = self.env["sagemaker_client"].list_models(
            SortBy="Name",
            SortOrder=sort_order,
            MaxResults=max_results,
            NameContains=self.endpoint_name,
        )
        sm_models = model_response["Models"]
        for sm_model in sm_models:
            if sm_model["ModelName"] == self.endpoint_name:
                logger.info(f"- Deleting the model {self.endpoint_name:}")
                self.env["sagemaker_client"].delete_model(ModelName=self.endpoint_name)

        # remove config
        config_response = self.env["sagemaker_client"].list_endpoint_configs(
            SortBy="Name",
            SortOrder=sort_order,
            MaxResults=max_results,
            NameContains=self.endpoint_name,
        )
        endpoint_configs = config_response["EndpointConfigs"]
        for endpoint_config in endpoint_configs:
            if endpoint_config["EndpointConfigName"] == self.endpoint_name:
                logger.info(f"- Deleting the endpoint config {self.endpoint_name:}")
                self.env["sagemaker_client"].delete_endpoint_config(
                    EndpointConfigName=self.endpoint_name
                )

        # remove docker image
        # TODO: manage deletion by version
        try:
            response = self.env["ecr_client"].delete_repository(
                repositoryName=self.repository_name, force=True
            )
            logger.info(f"- Deleting the docker repository {self.repository_name:}")
        except self.env["ecr_client"].exceptions.RepositoryNotFoundException:
            logger.info(f"Repository {self.repository_name} not found. If deploying")
        else:
            if response:
                logger.info(f"Response from deleting ECR repository {response}")

    def build_docker(self, setup_config_handler, setup_config):
        # tarball current folder but exclude checkpoints
        tmp_dir = os.path.join(setup_config_handler.config_dir, "tmp")
        os.makedirs(tmp_dir, exist_ok=True)
        exclude_list_file = os.path.join(tmp_dir, "exclude.txt")
        setup_config_handler.write_exclude_filelist(
            exclude_list_file, self.name, exclude_model=True
        )
        tarball = os.path.join(tmp_dir, f"{self.endpoint_name}.tar.gz")
        process = subprocess.run(
            [
                "tar",
                f"--exclude-from={exclude_list_file}",
                "-czf",
                shlex.quote(tarball),
                ".",
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        )
        if process.returncode != 0:
            raise RuntimeError(
                f"Exception in tarballing the project directory {process.stderr}"
            )

        # copy dockerfiles into current folder
        docker_dir = os.path.join(self.owd, "dockerfiles")
        for f in os.listdir(docker_dir):
            shutil.copyfile(os.path.join(docker_dir, f), os.path.join(self.root_dir, f))

        torchserve_config_file = os.path.join(self.root_dir, "config.properties")
        config = get_torchserve_config(
            torchserve_config_file,
            self.model.task.task_code,
            self.model.task.extra_torchserve_config,
        )
        Path(torchserve_config_file).write_text(config)

        # build docker
        docker_file = "gpu.Dockerfile" if self.use_gpu() else "Dockerfile"
        docker_build_command = docker_build_cmd(
            self.repository_name,
            docker_file=docker_file,
            tarball=tarball,
            requirements=setup_config["requirements"],
            setup=setup_config["setup"],
            my_secret=self.model.secret,
            task_code=self.model.task.task_code,
        )

        with subprocess.Popen(
            shlex.split(docker_build_command),
            bufsize=1,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
        ) as process:
            while process.poll() is None:
                print(".", end="", flush=True)
                out = process.stdout.readline().rstrip("\n")
                while out:
                    logger.debug(out)
                    out = process.stdout.readline().rstrip("\n")
                time.sleep(10)
            stdout, stderr = process.communicate()
            logger.debug(stdout)
            print("!")

            if process.returncode != 0:
                logger.exception(f"Error in docker build for model {self.name}")
                logger.info(stderr)
                raise RuntimeError("Error in docker build")

        os.remove(tarball)

    def build_and_push_docker(self, setup_config_handler, setup_config):
        logger.info(f"Building docker for model {self.name}")
        self.build_docker(setup_config_handler, setup_config)

        # docker login
        docker_credentials = self.env["ecr_client"].get_authorization_token()[
            "authorizationData"
        ][0]["authorizationToken"]
        user, p = base64.b64decode(docker_credentials).decode("ascii").split(":")
        process = subprocess.run(
            shlex.split(f"docker login -u {user} -p {p} {self.env['ecr_registry']}"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        )
        if process.returncode != 0:
            logger.exception(process.stderr)
            raise RuntimeError("Error in docker login")
        else:
            logger.debug(process.stdout)
        # tag docker
        image_ecr_path = f"{self.env['ecr_registry']}/{self.repository_name}"
        process = subprocess.run(
            shlex.split(
                f"{shlex.quote(self.repository_name)} {shlex.quote(image_ecr_path)}"
            ),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        )
        if process.returncode != 0:
            logger.exception(process.stderr)
            raise RuntimeError("Error in docker tag")
        else:
            logger.debug(process.stdout)

        # create ECR repo
        logger.info(f"Create ECR repository for model {self.name}")
        try:
            response = self.env["ecr_client"].create_repository(
                repositoryName=self.repository_name,
                imageScanningConfiguration={"scanOnPush": True},
            )
        except self.env["ecr_client"].exceptions.RepositoryAlreadyExistsException as e:
            logger.debug(f"Reuse existing repository since {e}")
        else:
            if response:
                logger.debug(f"Response from creating ECR repository {response}")

        # push docker
        logger.info(f"Pushing docker instance {image_ecr_path} for model {self.name}")
        process = subprocess.run(
            ["docker", "push", image_ecr_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        )
        if process.returncode != 0:
            logger.exception(process.stderr)
            raise RuntimeError("Error in docker push")
        else:
            logger.debug(process.stdout)
        return image_ecr_path

    def archive_and_upload_model(self, setup_config, s3_dir):
        # torchserve archive model to .tar.gz (.mar)
        # TODO: allow proper model versioning together with docker tag
        logger.info(f"Archiving the model {self.name} ...")
        archive_command = [
            "torch-model-archiver",
            "--model-name",
            shlex.quote(self.archive_name),
            "--serialized-file",
            shlex.quote(setup_config["checkpoint"]),
            "--handler",
            shlex.quote(setup_config["handler"]),
            "--version",
            "1.0",  # TODO: proper versioning
            "-f",
        ]
        if setup_config["model_files"]:
            extra_files = ",".join(shlex.quote(f) for f in setup_config["model_files"])
            archive_command += ["--extra-files", extra_files]
        process = subprocess.run(
            archive_command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        )
        if process.returncode != 0:
            logger.exception(process.stderr)
            raise RuntimeError("Error in torch-model-archiver")
        else:
            logger.debug(process.stdout)

        # tarball the .mar
        logger.info(f"Tarballing the archived model {self.name} ...")
        tarball = f"{self.archive_name}.tar.gz"
        mar = f"{self.archive_name}.mar"
        tarball_command = ["tar", "cfz", shlex.quote(tarball), shlex.quote(mar)]
        process = subprocess.run(
            tarball_command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        )
        if process.returncode != 0:
            logger.exception(process.stderr)
            raise RuntimeError("Error in tarballing archived torch model")
        else:
            logger.debug(process.stdout)

        # upload model tarball to S3
        logger.info(f"Uploading the archived model {self.name} to S3 ...")

        response = self.env["s3_client"].upload_file(
            tarball, self.env["bucket_name"], f"{s3_dir}/{tarball}"
        )
        if response:
            logger.debug(f"Response from the mar file upload to s3 {response}")
        model_s3_path = f"s3://{self.env['bucket_name']}/{s3_dir}/{tarball}"
        os.remove(tarball)
        os.remove(mar)
        return model_s3_path

    def deploy_model(self, image_ecr_path, model_s3_path):
        logger.info(f"Deploying model {self.name} to Sagemaker")

        torchserve_model = Model(
            model_data=model_s3_path,
            image_uri=image_ecr_path,
            role=build_config["sagemaker_role"],
            sagemaker_session=self.env["sagemaker_session"],
            predictor_cls=Predictor,
            name=self.endpoint_name,
            enable_network_isolation=True,
        )

        if self.model.task.create_endpoint:
            logger.info(f"Creating model and endpoint for {self.name} on Sagemaker")
            torchserve_model.deploy(
                instance_type=self.model.task.instance_type,
                initial_instance_count=self.model.task.instance_count,
                endpoint_name=self.endpoint_name,
            )
            return f"{build_config['gateway_url']}?model={self.endpoint_name}"
        else:
            logger.info(f"Creating model for {self.name} on Sagemaker")
            container_def = torchserve_model.prepare_container_def()
            self.env["sagemaker_session"].create_model(
                self.endpoint_name, build_config["sagemaker_role"], container_def
            )
            return None

    def deploy(self, s3_uri, endpoint_only=False, decen=False, decen_task_info=None):
        deployed, delayed, ex_msg = False, False, ""
        try:
            if not endpoint_only:
                self.delete_existing_endpoints()
                os.chdir(self.root_dir)
                setup_config_handler, setup_config, s3_dir = self.load_model(
                    s3_uri, decen=decen, decen_task_info=decen_task_info
                )
                image_ecr_path = self.build_and_push_docker(
                    setup_config_handler, setup_config
                )
                model_s3_path = self.archive_and_upload_model(setup_config, s3_dir)
                self.deploy_model(image_ecr_path, model_s3_path)
            else:
                _, _, s3_dir, _ = self.parse_s3_uri(s3_uri)
                tarball = f"{self.archive_name}.tar.gz"
                model_s3_path = f"s3://{self.env['bucket_name']}/{s3_dir}/{tarball}"
                image_ecr_path = f"{self.env['ecr_registry']}/{self.repository_name}"
                torchserve_model = Model(
                    model_data=model_s3_path,
                    image_uri=image_ecr_path,
                    role=build_config["sagemaker_role"],
                    sagemaker_session=self.env["sagemaker_session"],
                    predictor_cls=Predictor,
                    name=self.endpoint_name,
                    enable_network_isolation=True,
                )
                torchserve_model.deploy(
                    instance_type=self.model.task.instance_type,
                    initial_instance_count=self.model.task.instance_count,
                    endpoint_name=self.endpoint_name,
                )

        except RuntimeError as e:
            logger.exception(e)
            self.cleanup_on_failure(s3_uri)
            ex_msg = e
        except botocore.exceptions.ClientError as e:
            logger.exception(e)
            self.cleanup_on_failure(s3_uri)
            if e.response["Error"]["Code"] == "ResourceLimitExceeded":
                delayed = True
                ex_msg = f"Model deployment for {self.name} is delayed"
            else:
                ex_msg = "Unexpected error"
        except Exception as e:
            logger.exception(e)
            self.cleanup_on_failure(s3_uri)
            ex_msg = "Unexpected error"
        else:
            if not endpoint_only:
                self.cleanup_post_deployment()
            deployed = True
        finally:
            os.chdir(self.owd)
            if delayed:
                status = "delayed"
            elif deployed:
                status = "deployed" if self.model.task.create_endpoint else "created"
            else:
                status = "failed"
            response = {"status": status, "ex_msg": ex_msg}
            return response

    def cleanup_post_deployment(self):
        try:
            self.rootp.cleanup()
            # clean up local docker images
            subprocess.run(
                shlex.split(f"docker rmi {shlex.quote(self.repository_name)}")
            )
            image_tag = f"{self.env['ecr_registry']}/{self.repository_name}"
            subprocess.run(shlex.split(f"docker rmi {shlex.quote(image_tag)}"))
        except Exception as ex:
            logger.exception(
                f"Clean up post deployment for {self.endpoint_name} failed: {ex}"
            )

    def cleanup_on_failure(self, s3_uri=None):
        try:
            self.cleanup_post_deployment()
            self.delete_existing_endpoints()
            if s3_uri:
                _, _, s3_dir, endpoint_name = self.parse_s3_uri(s3_uri)
                if (
                    endpoint_name == self.endpoint_name
                    or endpoint_name == self.archive_name
                ):
                    self.env["s3_client"].delete_object(
                        Bucket=self.env["bucket_name"],
                        Key=f"{s3_dir}/{self.archive_name}.tar.gz",
                    )
            else:  # if no s3_uri is
                part_key = f"torchserve/models/{self.model.task.task_code}"
                self.env["s3_client"].delete_object(
                    Bucket=self.env["bucket_name"],
                    Key=f"{part_key}/{self.archive_name}.tar.gz",
                )
        except Exception as ex:
            logger.exception(
                f"Clean up on failed deployment for {self.endpoint_name} failed: {ex}"
            )

    def use_gpu(self) -> bool:
        return self.model.task.gpu


def docker_build_cmd(
    repository_name: str, docker_file: str = "Dockerfile", **build_args
):
    repository_name = shlex.quote(repository_name)
    docker_file = shlex.quote(docker_file)
    docker_build_args = " ".join(
        f"--build-arg {k}={shlex.quote(str(v))}" for k, v in build_args.items()
    )
    message = "docker build --network host -t"
    return f"{message} {repository_name} -f {docker_file} {docker_build_args} ."


def get_torchserve_config(
    base_file: Path, task_code: str, extra_torchserve_config_str: str
) -> str:
    base_content = Path(base_file).read_text()
    config = extra_torchserve_config_str
    if not config:
        return base_content
    config = json.loads(config)

    extra_lines = [f"# extra settings from task {task_code}"]
    for k, v in config.items():
        assert isinstance(v, (str, bool, int)), "Invalid config file"
        if isinstance(v, bool):
            v = str(v).lower()
        extra_lines.append(f"{k}={v}")

    extra_content = "\n".join(extra_lines)
    return "\n\n".join((base_content, extra_content, ""))
