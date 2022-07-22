# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) MLCommons, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import base64
import os
import time
from zipfile import ZipFile

import boto3

import docker
from dotenv import load_dotenv


load_dotenv()


class Builder:
    def __init__(self):
        self.session = boto3.Session(
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION"),
        )
        self.s3 = self.session.client("s3")
        self.ecs = self.session.client("ecs")
        self.lamda_ = self.session.client("lambda")
        self.api_gateway = self.session.client("apigateway")
        self.ecr = self.session.client("ecr")

    def download_zip(self, bucket_name: str, model: str):
        zip_name = model.split("/")[-1]
        folder_name = model.split("/")[-1].split(".")[0]
        model_name = "-".join(zip_name.split(".")[0].replace(" ", "").split("-")[1:])
        self.s3.download_file(
            bucket_name, model, f"./app/{folder_name}/model/{zip_name}"
        )
        return zip_name, model_name

    def unzip_file(self, zip_name: str):
        folder_name = zip_name.split(".")[0]
        with ZipFile(f"./app/{folder_name}/model/{zip_name}", "r") as zipObj:
            zipObj.extractall(f"./app/{folder_name}/model")
        os.remove(f"./app{folder_name}/model/{zip_name}")

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
        response = self.ecr.create_repository(
            repositoryName=repo_name, imageScanningConfiguration={"scanOnPush": True}
        )
        return response["repository"]["repositoryUri"]

    def push_image_to_ECR(
        self, repository_name: str, folder_name: str, tag: str
    ) -> str:
        ecr_config = self.extract_ecr_configuration()
        self.docker_client.login(
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
        return f"{repository_name}:{tag}"

    def create_task_definition(self, name_task: str, repo: str) -> str:
        task_definition = self.ecs.register_task_definition(
            containerDefinitions=[
                {
                    "name": name_task,
                    "image": repo,
                }
            ],
            executionRoleArn="arn:aws:iam::877755283837:role/ecsTaskExecutionRole",
            family=name_task,
            networkMode="awsvpc",
            requiresCompatibilities=["FARGATE"],
            cpu="4096",
            memory="20480",
        )
        return task_definition["taskDefinition"]["containerDefinitions"][0]["name"]

    def create_ecs_endpoint(self, name_task: str, repo: str) -> str:
        task_definition = self.create_task_definition(name_task, repo)
        run_task = self.ecs.run_task(
            taskDefinition=task_definition,
            launchType="FARGATE",
            platformVersion="LATEST",
            cluster="heavy-task-evaluation",
            count=1,
            networkConfiguration={
                "awsvpcConfiguration": {
                    "subnets": [
                        "subnet-04083c55819f5735b",
                        "subnet-05e3df7114f1e3355",
                    ],
                    "assignPublicIp": "ENABLED",
                    "securityGroups": ["sg-0e498213dde90a0fd"],
                }
            },
        )
        while True:
            describe_task = self.ecs.describe_tasks(
                cluster="heavy-task-evaluation", tasks=[run_task["tasks"][0]["taskArn"]]
            )
            if describe_task["tasks"][0]["containers"][0]["lastStatus"] != "RUNNING":
                time.sleep(60)
            else:
                eni = self.eni.NetworkInterface(
                    describe_task["tasks"][0]["attachments"][0]["details"][1]["value"]
                )
                ip = eni.association_attribute["PublicIp"]
                break
        return ip

    def get_ip_ecs_task(self, model: str):
        zip_name, model_name = self.download_zip(os.getenv("AWS_S3_BUCKET"), model)
        folder_name = zip_name.split(".")[0]
        self.unzip_file(zip_name)
        repo = self.create_repository(model_name)
        tag = "latest"
        self.push_image_to_ECR(repo, f"./app/{folder_name}/model/{model_name}", tag)
        ip = self.create_ecs_endpoint(model_name, f"{repo}")
        return ip, model_name

    def light_model_deployment(self, role, image_uri):
        lambda_function = self.lamda_.create_function(
            {
                "FunctionName": "lambda-sentiment-test-2",
                "Role": role,
                "Code": {"ImageUri": image_uri},
                "PackageType": "Image",
            }
        )
        return lambda_function
