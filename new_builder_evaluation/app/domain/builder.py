# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
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
        self.ec2 = boto3.resource(
            "ec2",
            region_name=os.getenv("AWS_REGION"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )
        self.s3 = self.session.client("s3")
        self.iam = self.session.client("iam")
        self.ecs = self.session.client("ecs")
        self.lamda_ = self.session.client("lambda")
        self.api_gateway = self.session.client("apigateway")
        self.ecr = self.session.client("ecr")
        self.docker_client = docker.from_env()

    def download_zip(self, bucket_name: str, model: str):
        zip_name = model.split("/")[-1]
        folder_name = model.split("/")[-1].split(".")[0]
        model_name = "-".join(zip_name.split(".")[0].replace(" ", "").split("-")[1:])
        self.s3.download_file(
            bucket_name, model, f"./app/models/{folder_name}/{zip_name}"
        )
        return zip_name, model_name

    def unzip_file(self, zip_name: str):
        folder_name = zip_name.split(".")[0]
        with ZipFile(f"./app/models/{folder_name}/{zip_name}", "r") as zipObj:
            zipObj.extractall(f"./app/models/{folder_name}")
        os.remove(f"./app/models/{folder_name}/{zip_name}")
        return folder_name

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
        self,
        repository_name: str,
        folder_name: str,
        tag: str,
        model_name: str,
        docker_name: str = "Dockerfile",
    ) -> str:
        ecr_config = self.extract_ecr_configuration()
        self.docker_client.login(
            username=ecr_config["ecr_username"],
            password=ecr_config["ecr_password"],
            registry=ecr_config["ecr_url"],
        )
        path = f"{folder_name}/{model_name}"
        absolute_path = os.getenv("ABSOLUTE_PATH")
        image, _ = self.docker_client.images.build(
            path=path, tag=tag, dockerfile=f"{absolute_path}/{path}/{docker_name}"
        )
        image.tag(repository=repository_name, tag=tag)
        self.docker_client.images.push(
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
            executionRoleArn=os.getenv("EXECUTION_ROLE_ARN"),
            family=name_task,
            networkMode="awsvpc",
            requiresCompatibilities=["FARGATE"],
            cpu=os.getenv("CPU_UTILIZATION"),
            memory=os.getenv("MEMORY_UTILIZATION"),
        )
        return task_definition["taskDefinition"]["containerDefinitions"][0]["name"]

    def create_ecs_endpoint(self, name_task: str, repo: str) -> str:
        task_definition = self.create_task_definition(name_task, repo)
        run_service = self.ecs.create_service(
            cluster=os.getenv("CLUSTER_TASK_EVALUATION"),
            serviceName=name_task,
            taskDefinition=task_definition,
            desiredCount=1,
            networkConfiguration={
                "awsvpcConfiguration": {
                    "subnets": [
                        os.getenv("SUBNET_1"),
                        os.getenv("SUBNET_2"),
                    ],
                    "assignPublicIp": "ENABLED",
                    "securityGroups": [os.getenv("SECURITY_GROUP")],
                }
            },
            launchType="FARGATE",
        )
        while True:
            describe_service = self.ecs.describe_services(
                cluster=os.getenv("CLUSTER_TASK_EVALUATION"),
                services=[run_service["service"]["serviceArn"]],
            )
            service_state = describe_service["services"][0]["deployments"][0][
                "rolloutState"
            ]
            if service_state != "COMPLETED":
                time.sleep(60)
            else:
                arn_service = describe_service["services"][0]["serviceArn"]
                run_task = self.ecs.list_tasks(
                    cluster=os.getenv("CLUSTER_TASK_EVALUATION"), serviceName=name_task
                )["taskArns"]
                describe_task = self.ecs.describe_tasks(
                    cluster=os.getenv("CLUSTER_TASK_EVALUATION"), tasks=run_task
                )
                eni = self.ec2.NetworkInterface(
                    describe_task["tasks"][0]["attachments"][0]["details"][1]["value"]
                )
                ip = eni.association_attribute["PublicIp"]
                break
        return ip, arn_service

    def delete_ecs_service(self, arn_service: str):
        self.ecs.delete_service(
            cluster=os.getenv("CLUSTER_TASK_EVALUATION"),
            service=arn_service,
            force=True,
        )

    def get_ip_ecs_task(self, model: str):
        zip_name, model_name = self.download_zip(os.getenv("AWS_S3_BUCKET"), model)
        folder_name = self.unzip_file(zip_name)
        repo = self.create_repository(model_name)
        tag = "latest"
        self.push_image_to_ECR(repo, f"./app/models/{folder_name}", tag, model_name)
        ip, arn_service = self.create_ecs_endpoint(model_name, f"{repo}")
        return ip, model_name, folder_name, arn_service

    def create_light_repository(self, repo_name: str) -> str:
        response = self.ecr.create_repository(
            repositoryName=repo_name, imageScanningConfiguration={"scanOnPush": True}
        )
        return response["repository"]["repositoryUri"]

    def get_digest_repo(self, repo_name: str):
        return self.ecr.list_images(repositoryName=repo_name)["imageIds"][0][
            "imageDigest"
        ]

    def light_model_deployment(self, function_name: str, repo: str):
        lambda_function = self.lamda_.create_function(
            FunctionName=function_name,
            Code={"ImageUri": repo},
            Role=os.getenv("ROLE_ARN_LAMBDA"),
            PackageType="Image",
            Timeout=800,
            MemorySize=os.getenv("LAMBDA_MEMORY_SIZE"),
            EphemeralStorage={"Size": 10240},
        )
        return lambda_function

    def create_permission_lambda_function(self, function_name: str):
        self.lamda_.add_permission(
            FunctionName=function_name,
            StatementId="FunctionURLAllowAccess",
            Action="lambda:InvokeFunctionUrl",
            Principal="*",
            FunctionUrlAuthType="NONE",
        )

    def create_url_light_model(self, function_name: str):
        return self.lamda_.create_function_url_config(
            FunctionName=function_name,
            AuthType="NONE",
            Cors={
                "AllowCredentials": True,
                "AllowMethods": [
                    "*",
                ],
                "AllowOrigins": [
                    "*",
                ],
            },
        )["FunctionUrl"]

    def create_light_model(self, model_name: str, folder_name: str):
        model_name_light = model_name + "-light"
        repo = self.create_light_repository(model_name_light)
        tag = "latest"
        self.push_image_to_ECR(
            repo,
            f"./app/models/{folder_name}",
            tag,
            model_name,
            docker_name="Dockerfile.aws.lambda",
        )
        digest = self.get_digest_repo(model_name_light)
        repo = repo + "@" + digest
        self.light_model_deployment(model_name, repo)
        self.create_permission_lambda_function(model_name)
        return self.create_url_light_model(model_name)
