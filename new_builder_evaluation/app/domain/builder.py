import base64
import logging
import shutil
import os
import time
from zipfile import ZipFile

import boto3
import botocore
import docker

from app import utils

log = logging.getLogger(__name__)

def get_model_name(model_zip_uri: str) -> str:
    model_name = model_zip_uri.split("/")[-1]
    model_name = "-".join(model_name.split(".")[0].replace(" ", "").split("-")[1:])
    assert model_name, f"Couldn't extract a proper model name from {model_zip_uri}"
    return model_name

class Builder:
    def __init__(self):
        self.session = boto3.Session(
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.environ["AWS_REGION"],
        )
        self.s3 = self.session.client("s3")
        self.ecs = self.session.client("ecs")
        self.ec2 = self.session.client("ec2")
        self.lamda_ = self.session.client("lambda")
        self.api_gateway = self.session.client("apigateway")
        self.ecr = self.session.client("ecr")
        self.decentralized = bool(os.getenv("DYNABENCH_API"))
        # Required keys
        self.task_execution_role = os.environ["AWS_TASK_EXECUTION_ROLE"]
        self.s3_bucket = os.environ["AWS_S3_BUCKET"]

    def download_and_unzip(self, bucket_name: str, model_zip_uri: str) -> None:
        zip_name = model_zip_uri.split("/")[-1]
        local_zip_file = f"./app/model/{zip_name}"
        if self.decentralized:
            # return utils.api_download_model(model, model.secret)
            shutil.copyfile(
                f"/home/ubuntu/submissions/flores_small1-dummy.zip",
                local_zip_file,
            )
        else:
            self.s3.download_file(bucket_name, model_zip_uri, local_zip_file)

        with ZipFile(local_zip_file, "r") as zipObj:
            zipObj.extractall("./app/model")
        os.remove(local_zip_file)

    def extract_ecr_configuration(self) -> dict:
        ecr_credentials = self.ecr.get_authorization_token()["authorizationData"][0]
        ecr_password = (
            base64.b64decode(ecr_credentials["authorizationToken"])
            .replace(b"AWS:", b"")
            .decode("utf-8")
        )
        ecr_url = ecr_credentials["proxyEndpoint"]
        return {"ecr_username": "AWS", "ecr_password": ecr_password, "ecr_url": ecr_url}

    def create_repository(self, repo_name: str) -> str:
        try:
            response = self.ecr.create_repository(
                repositoryName=repo_name,
                imageScanningConfiguration={"scanOnPush": True},
            )
            return response["repository"]["repositoryUri"]
        except self.ecr.exceptions.RepositoryAlreadyExistsException as e:
            log.info(f"reusing repository '{repo_name}', because {e}")
            return repo_name

    def push_image_to_ECR(
        self, repository_name: str, folder_name: str, tag: str
    ) -> str:
        ecr_config = self.extract_ecr_configuration()
        docker_client = docker.from_env()
        docker_client.login(
            username=ecr_config["ecr_username"],
            password=ecr_config["ecr_password"],
            registry=ecr_config["ecr_url"],
        )
        image, _ = docker_client.images.build(path=folder_name, tag=tag)
        image.tag(repository=repository_name, tag=tag)
        docker_client.images.push(
            repository=repository_name,
            tag=tag,
            auth_config={
                "username": ecr_config["ecr_username"],
                "password": ecr_config["ecr_password"],
            },
        )
        log.info(f"Pushed docker image {image} to ECR {repository_name}")
        return f"{repository_name}:{tag}"

    def create_task_definition(self, name_task: str, repo: str) -> str:
        task_definition = self.ecs.register_task_definition(
            containerDefinitions=[
                {
                    "name": name_task,
                    "image": repo,
                }
            ],
            executionRoleArn=self.task_execution_role,
            family=name_task,
            networkMode="awsvpc",
            requiresCompatibilities=["FARGATE"],
            # TODO: This seems a lot. Also it should be configurable per task organizer
            cpu="4096",
            memory="20480",
        )
        return task_definition["taskDefinition"]["containerDefinitions"][0]["name"]

    def create_ecs_endpoint(self, name_task: str, repo: str) -> str:
        task_definition = self.create_task_definition(name_task, repo)
        network_conf = {
            "awsvpcConfiguration": {
                "subnets": [
                    "subnet-01b185240f6acd9e8",
                    "subnet-0c45b0e60743f8465",
                ],
                "assignPublicIp": "ENABLED",
                "securityGroups": ["sg-038b2a6f25a971995"],
            }
        }
        breakpoint()
        run_task = self.ecs.run_task(
            taskDefinition=task_definition,
            launchType="FARGATE",
            platformVersion="LATEST",
            cluster="heavy-task-evaluation",
            count=1,
            networkConfiguration=network_conf,
        )
        while True:
            describe_task = self.ecs.describe_tasks(
                cluster="heavy-task-evaluation", tasks=[run_task["tasks"][0]["taskArn"]]
            )
            if describe_task["tasks"][0]["containers"][0]["lastStatus"] != "RUNNING":
                time.sleep(60)
            else:
                eni = self.ec2.NetworkInterface(
                    describe_task["tasks"][0]["attachments"][0]["details"][1]["value"]
                )
                ip = eni.association_attribute["PublicIp"]
                break
        return ip

    def get_ip_ecs_task(self, model_zip_uri: str):
        model_name = get_model_name(model_zip_uri)
        # TODO: uncomment
        return "18.236.97.178", model_name

        self.download_and_unzip(self.s3_bucket, model_zip_uri)
        repo = self.create_repository(model_name)
        self.push_image_to_ECR(repo, './app/model/{}'.format(model_name), tag = "latest")
        ip = self.create_ecs_endpoint(model_name, repo)
        return ip, model_name

    def light_model_deployment(self):
        lambda_function = self.lamda_.create_function(
            {
                "FunctionName": "lambda-sentiment-test-2",
                "Role": "arn:aws:iam::877755283837:role/service-role/python-fastapi-hello-role-usk428mk",
                "Code": {
                    "ImageUri": "877755283837.dkr.ecr.eu-west-3.amazonaws.com/sentiment-lambda@sha256:11ccc0762147dc17e0007628dd4fddfdbbc2c108d3168e7e38bc89a58a2c4826"
                },
                "PackageType": "Image",
            }
        )
        return lambda_function
