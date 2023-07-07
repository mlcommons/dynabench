### WIP: DEFINE PROD AWS ACCOUNT OWNER ID = {prod_aws_account_owner_id}
# Task Owner Setup
In this document, we will go through how to set up a decentralized task on Dynabench (https://dynabench.org/), from a blank AWS account.

# Setup the EC2 instances to run build/evaluation server

To run a decentralized task, you will need to run a build server and an evaluation server in your AWS environment. To do that, do the following:

1. Navigate to your AWS account
2. Go to `EC2` service in AWS
3. Go to the `Instances` tab
4. Click `Launch Instances` (the orange button on the top right)
5. When the prompt asks you to choose an AMI, paste the following in the search bar: `ubuntu/images/hvm-ssd/ubuntu-bionic-18.04-amd64-server-20201026`, and select that image (Choose the search result  in “Community AMIs”)
6. When the prompt asks you to choose an Instance Type, choose `T2.2xlarge`
7. Then click `Configure Instance Details`, do NOT click `Review and Launch Instance`
8. Don’t change any settings in the `Configure Instance` prompt, click `Next: Add Storage`
9. Put `128` in the `GiB` field
10. Then click `Review and Launch`

After launching the EC2 instance, make sure to download the `.pem` file and keep it somewhere secure on your laptop. We will refer to the path of this file as `{PEM_FILE_PATH}` here onwards. Also, find the IPv4 address of your instance (click on `Instances`, click on the instance you just created, and in the panel that pops up below click `Networking` and the IPv4 address will appear under `Public IPv4 address`). We will refer to this as `{EC2_IPV4_ADDRESS}`.

# Setup Code
SSH into your EC2 instance by running `ssh -i {PEM_FILE_PATH} ubuntu@{EC2_IPV4_ADDRESS}`. For example, the command might look like:
```
ssh -i ~/Documents/key.pem ubuntu@34.283.179.343
```

In this instance, we will first be setting up the environment using Anaconda:
1. `cd` into `/tmp`
2. Download Anaconda by running `curl -O https://repo.anaconda.com/archive/Anaconda3-2021.05-Linux-x86_64.sh` (this should be the right Anaconda package for the ubuntu image we downloaded above, but if not feel free to download the right package)
3. Run `bash Anaconda3-2021.05-Linux-x86_64.sh` to install Anaconda
4. The bash script will ask you where to download Anaconda. Choose the default option (you can just press ENTER here)
5. The bash script will ask whether to automatically run `conda init`. Choose Yes (you can enter `Y`)
6. The bash script should finish installing. Then run `source ~/.bashrc` to activate the conda install

Now we will clone the Dynabench github repo, to finish setting up the environment:
1. `cd` into your home directory (or just enter `cd`). This should be `/home/ubuntu` (you can check your current working directory by entering `pwd`)
2. Run `git clone https://github.com/mlcommons/dynabench.git`
3. Run `cd dynbench`
4. Run `conda create -n dev python=3.7`
5. Run `conda activate dev`
6. Run `pip install -r requirements.txt`
7. Run `cd dynabench/builder`
8. Run `pip install -r requirements.txt`

At this point we have our environment setup, but we still have to create and fill out the config files for running the build and evaluation servers.

# Setup config files
To run the build and evaluation servers, we have to pull AWS keys and other relevant information from a config file.

## Setting up `build_config`
1. `cd ~/dynabench/builder`
2. Open a file called `build_config.py` with your favorite text editor, or by just entering `vim build_config.py`
3. Enter the following template to fill out
```
build_config = {
   "aws_access_key_id": "",
   "aws_secret_access_key": "",
   "aws_region": "",
   "sagemaker_role": "",
   "gateway_url": "",
   "queue_dump": "queue.dump",
   "builder_sqs_queue": "",
   "evaluation_sqs_queue": "",
   "DYNABENCH_API": "",
   "decen_eaas_secret": ""
}
```
### IAM specifications
First, we will be setting up the IAM user/roles needed to fill out the `aws_access_key_id`, `aws_secret_access_key` and `sagemaker_role` above. Create a custom policy with the following config (we will call this the `task_owner_policy` - this name is not important, but we will be attaching this policy to a user/role later on).
```
{
    "Version": "2020-10-20",
    "Statement": [
        {
            "Sid": "TaskOwnerPolicy",
            "Effect": "Allow",
            "Action": [
                "ecr:PutImageTagMutability",
                "ecr:StartImageScan",
                "ecr:ListTagsForResource",
                "ecr:UploadLayerPart",
                "ecr:BatchDeleteImage",
                "ecr:ListImages",
                "ecr:DeleteRepository",
                "ecr:CompleteLayerUpload",
                "ecr:DescribeRepositories",
                "ecr:DeleteRepositoryPolicy",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetLifecyclePolicy",
                "ecr:PutLifecyclePolicy",
                "ecr:DescribeImageScanFindings",
                "ecr:GetLifecyclePolicyPreview",
                "ecr:CreateRepository",
                "ecr:PutImageScanningConfiguration",
                "ecr:GetDownloadUrlForLayer",
                "ecr:GetAuthorizationToken",
                "ecr:DeleteLifecyclePolicy",
                "ecr:PutImage",
                "ecr:BatchGetImage",
                "ecr:DescribeImages",
                "ecr:StartLifecyclePolicyPreview",
                "ecr:InitiateLayerUpload",
                "ecr:GetRepositoryPolicy",
                "iam:GetRole"
            ],
            "Resource": "*"
        },
        {
            "Sid": "VisualEditor1",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::*"
        }
    ]
}
```

Now, we will be creating an execution role for Sagemaker (this is a part of AWS) to deploy models on your account's behalf. Create a new role with the name `sagemaker_role`, and attach two policies:
1. ` AmazonSageMakerFullAccess` (this is a default policy that AWS provides)
2. `task_owner_policy` from above

After you've created the role, add a trust relationship for sagemaker to this role. **This step is important**, without it, you will get `InternalFailure` thrown from AWS without any stack trace as to what is going wrong. To do add a trust relationship, navigate to your role, click on the tab that says `Trust Relationship`, click on `Edit Trust Relationship` which will popuop an interface to enter JSON, and add a section under `Statements` as follows:
```
{
    "Effect": "Allow",
    "Principal": {
        "Service": "sagemaker.amazonaws.com"
    },
    "Action": "sts:AssumeRole"
}
```
This might not be the only thing in your JSON depending on how your account is setup, but this portion should be one of the dictionaries under `Statements`. For example, a full JSON might look like:
```
{
  "Version": "2012-10-17",
  "Statement": [
     {
      "Effect": "Allow",
      "Principal": {
        "Service": "sagemaker.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    },
    {
      "Effect": "Allow",
      "Principal": {
        "Service": [
          "other service"
        ]
      },
      ... (rest of the file)
    }
  ]
}
```

Finally, we will be creating the main user. Create a user with the name `dynabench_task_owner` and attach the following policies:
1. `AmazonSQSFullAccess`
2. `AmazonEC2ContainerRegistryFullAccess`
3. `AmazonS3FullAccess`
4. `AmazonSageMakerFullAccess`
5. `task_owner_policy` (the policy you made above)

Once you've created this user, navigate to the `Security Credentials` tab and click `Create access key`. This will create an access key id, and and access key secret. Copy these into the `build_config` file. Then add the name of the sagemaker execution role you created (if you followed our name suggestion, this will be `sagemaker_role`) to the `sagemaker_role` field in `build_config`. At this point, your `build_config` file should look like:

```
build_config = {
   "aws_access_key_id": THIS SHOULD BE FILLED,
   "aws_secret_access_key": THIS SHOULD BE FILLED,
   "aws_region": "",
   "sagemaker_role": THIS SHOULD BE FILLED,
   "gateway_url": "",
   "queue_dump": "queue.dump",
   "builder_sqs_queue": "",
   "evaluation_sqs_queue": "",
   "DYNABENCH_API": "",
   "decen_eaas_secret": ""
}
```

### SQS queue specification
To recieve messages to build and evaluate models, Dynabench uses SQS. This portion is simple, we just have to create two SQS queues. To do this:
1. Navigate to SQS in the AWS console
2. Click on `Create Queue`
3. In the `Name` section, enter `dev-build`
4. Under `Access policy`, and under `Define who can send messages to the queue`, choose the `Only the specified AWS accounts, IAM users and roles`
5. In the right hand column, you should see a portion that looks like:
```
    {
      "Sid": "__sender_statement",
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          ""
        ]
      },
      "Action": [
        "SQS:SendMessage"
      ],
      "Resource": "arn:aws:sqs:us-west-1:{YOUR_AWS_ACCOUNT_ID}:dev-build"
    }
```
Fill in the `AWS` string with `"arn:aws:iam::{prod_aws_account_owner_id}:root"` and change allows action from `"SQS:SendMessage"` to `"SQS:*"`. Your final access policy should look something like:
```
{
  "Version": "2020-10-20",
  "Id": "__default_policy_ID",
  "Statement": [
    {
      "Sid": "__owner_statement",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::{YOUR_AWS_ACCOUNT_ID}:root"
      },
      "Action": "SQS:*",
      "Resource": "arn:aws:sqs:us-west-1:{YOUR_AWS_ACCOUNT_ID}:dev-build"
    },
    {
      "Sid": "__sender_statement",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::{prod_aws_account_owner_id}:root"
      },
      "Action": "SQS:*",
      "Resource": "arn:aws:sqs:us-west-1:{YOUR_AWS_ACCOUNT_ID}:dev-build"
    }
  ]
}
```

Repeat the exact steps above to create another queue, and name it `dev-eval`.

Then add `dev-build` to your build config under `builder_sqs_queue`. Then add `dev-eval` to your build config under `evaluation_sqs_queue`. Your `build_config` should then look something like:


```
build_config = {
   "aws_access_key_id": THIS SHOULD BE FILLED,
   "aws_secret_access_key": THIS SHOULD BE FILLED,
   "aws_region": "",
   "sagemaker_role": THIS SHOULD BE FILLED,
   "gateway_url": "",
   "queue_dump": "queue.dump",
   "builder_sqs_queue": THIS SHOULD BE FILLED,
   "evaluation_sqs_queue": THIS SHOULD BE FILLED,
   "DYNABENCH_API": "",
   "decen_eaas_secret": ""
}
```

### Filling in `gateway_url`
To securely talk to Sagemaker model endpoints, Dynabench uses API Gateway.

First, we have to import the 3 lambda functions that are used by the API Gateway (a function to handle CORS, a function to authorize requests, and a function to invoke sagemaker model endpoints). First navigate to the lambda function homepage (go to `AWS Lambda` -> `Functions`).

(1) To create `corsHandlerJs`

From the lambda function home page, press `Create function`, name the function `corsHandlerJs`, choose `Node.js 14.x` as the runtime. Then click `Create function`. Then you will be taken to a page with the lambda function you just created. Click `Upload from` in the top right of the Code source panel, and upload the zip file for the cors handler.

(2) To create `ApiGatewayAuthorizerJs`

From the lambda function home page, press `Create function`, name the function `ApiGatewayAuthorizerJs`, choose `Node.js 14.x` as the runtime. Then click `Create function`. Then you will be taken to a page with the lambda function you just created. Click `Upload from` in the top right of the Code source panel, and upload the zip file for the ApiGatewayAuthorizerJs handler.

(3) To create `InvokeSagemakerEndpoint`

From the lambda function home page, press `Create function`, name the function `InvokeSagemakerEndpoint`, choose `Python 3.8` as the runtime. Then click `Create function`. Then you will be taken to a page with the lambda function you just created. Click `Upload from` in the top right of the Code source panel, and upload the zip file for the InvokeSagemakerEndpoint handler.

Now, we construct the API Gateway. Luckily, we can import the exact API Gateway we use in Dynabench through Open API 3. First, go to API Gateway, click `Create API`. When asked to Choose an API Type, navigate to the `REST API` panel but DO NOT CLICK `Build`. Instead, click `Import`. Then choose `Import from Swagger or Open API 3` from the `Create a new API` radio button list. In the text field below the radio buttons, copy paste the following:

```
{
  "openapi" : "3.0.1",
  "info" : {
    "title" : "SagemakerEndpointAuth",
    "description" : "Secure gateway to access Sagemaker model endpoints through lambda",
    "version" : "2021-07-16T00:36:57Z"
  },
  "servers" : [ {
    "url" : "https://obws766r82.execute-api.us-west-1.amazonaws.com/{basePath}",
    "variables" : {
      "basePath" : {
        "default" : "/predict"
      }
    }
  } ],
  "paths" : {
    "/" : {
      "post" : {
        "parameters" : [ {
          "name" : "model",
          "in" : "query",
          "required" : true,
          "schema" : {
            "type" : "string"
          }
        } ],
        "responses" : {
          "200" : {
            "description" : "200 response",
            "headers" : {
              "Access-Control-Allow-Origin" : {
                "schema" : {
                  "type" : "string"
                }
              },
              "Access-Control-Allow-Credentials" : {
                "schema" : {
                  "type" : "string"
                }
              }
            },
            "content" : {
              "application/json" : {
                "schema" : {
                  "$ref" : "#/components/schemas/Empty"
                }
              }
            }
          }
        },
        "security" : [ {
          "APIGatewayAuthorizer" : [ ]
        } ],
        "x-amazon-apigateway-request-validator" : "Validate query string parameters and headers",
        "x-amazon-apigateway-integration" : {
          "credentials" : "arn:aws:iam::YOUR_AWS_ACCOUNT_ID:role/InvokeLambdaRole",
          "httpMethod" : "POST",
          "uri" : "arn:aws:apigateway:us-west-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-west-1:YOUR_AWS_ACCOUNT_ID:function:InvokeSagemakerEndpoint/invocations",
          "responses" : {
            "default" : {
              "statusCode" : "200",
              "responseParameters" : {
                "method.response.header.Access-Control-Allow-Credentials" : "'true'",
                "method.response.header.Access-Control-Allow-Origin" : "'*'"
              },
              "responseTemplates" : {
                "application/json" : "$input.json(\"$\")\n#set($origin = $input.params(\"origin\"))\n#set($context.responseOverride.header.Access-Control-Allow-Origin=\"$origin\")"
              }
            }
          },
          "requestTemplates" : {
            "application/json" : "{\n\"data\": $input.json('$'),\n\"model\":\"$input.params('model')\"\n}\n"
          },
          "passthroughBehavior" : "never",
          "contentHandling" : "CONVERT_TO_TEXT",
          "type" : "aws"
        }
      },
      "options" : {
        "responses" : {
          "200" : {
            "description" : "200 response",
            "headers" : {
              "Access-Control-Allow-Origin" : {
                "schema" : {
                  "type" : "string"
                }
              },
              "Access-Control-Allow-Methods" : {
                "schema" : {
                  "type" : "string"
                }
              },
              "Access-Control-Allow-Credentials" : {
                "schema" : {
                  "type" : "string"
                }
              },
              "Access-Control-Allow-Headers" : {
                "schema" : {
                  "type" : "string"
                }
              }
            },
            "content" : {
              "application/json" : {
                "schema" : {
                  "$ref" : "#/components/schemas/Empty"
                }
              }
            }
          }
        },
        "x-amazon-apigateway-integration" : {
          "httpMethod" : "POST",
          "uri" : "arn:aws:apigateway:us-west-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-west-1:YOUR_AWS_ACCOUNT_ID:function:corsHandlerJs/invocations",
          "responses" : {
            "default" : {
              "statusCode" : "200"
            }
          },
          "passthroughBehavior" : "when_no_match",
          "contentHandling" : "CONVERT_TO_TEXT",
          "type" : "aws_proxy"
        }
      }
    }
  },
  "components" : {
    "schemas" : {
      "Empty" : {
        "title" : "Empty Schema",
        "type" : "object"
      }
    },
    "securitySchemes" : {
      "APIGatewayAuthorizer" : {
        "type" : "apiKey",
        "name" : "Authorization",
        "in" : "header",
        "x-amazon-apigateway-authtype" : "custom",
        "x-amazon-apigateway-authorizer" : {
          "authorizerUri" : "arn:aws:apigateway:us-west-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-west-1:YOUR_AWS_ACCOUNT_ID:function:ApiGatewayAuthorizerJs/invocations",
          "authorizerResultTtlInSeconds" : 0,
          "type" : "token"
        }
      }
    }
  },
  "x-amazon-apigateway-gateway-responses" : {
    "DEFAULT_5XX" : {
      "responseParameters" : {
        "gatewayresponse.header.Access-Control-Allow-Methods" : "'OPTIONS,POST'",
        "gatewayresponse.header.Access-Control-Allow-Credentials" : "'true'",
        "gatewayresponse.header.Access-Control-Allow-Origin" : "'https://dynabench.org'",
        "gatewayresponse.header.Access-Control-Allow-Headers" : "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
      }
    },
    "AUTHORIZER_FAILURE" : {
      "statusCode" : 401,
      "responseParameters" : {
        "gatewayresponse.header.Access-Control-Allow-Methods" : "'OPTIONS,POST'",
        "gatewayresponse.header.Access-Control-Allow-Credentials" : "'true'",
        "gatewayresponse.header.Access-Control-Allow-Origin" : "'https://dynabench.org'",
        "gatewayresponse.header.Access-Control-Allow-Headers" : "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
      },
      "responseTemplates" : {
        "application/json" : "{\"message\":$context.error.messageString}"
      }
    },
    "AUTHORIZER_CONFIGURATION_ERROR" : {
      "statusCode" : 500,
      "responseParameters" : {
        "gatewayresponse.header.Access-Control-Allow-Methods" : "'OPTIONS,POST'",
        "gatewayresponse.header.Access-Control-Allow-Credentials" : "'true'",
        "gatewayresponse.header.Access-Control-Allow-Origin" : "'https://dynabench.org'",
        "gatewayresponse.header.Access-Control-Allow-Headers" : "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
      },
      "responseTemplates" : {
        "application/json" : "{\"message\":$context.error.messageString}"
      }
    },
    "DEFAULT_4XX" : {
      "responseParameters" : {
        "gatewayresponse.header.Access-Control-Allow-Methods" : "'OPTIONS,POST'",
        "gatewayresponse.header.Access-Control-Allow-Credentials" : "'true'",
        "gatewayresponse.header.Access-Control-Allow-Origin" : "'https://dynabench.org'",
        "gatewayresponse.header.Access-Control-Allow-Headers" : "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
      }
    }
  },
  "x-amazon-apigateway-request-validators" : {
    "Validate query string parameters and headers" : {
      "validateRequestParameters" : true,
      "validateRequestBody" : false
    }
  }
}
```

Now replace everywhere it says `YOUR_AWS_ACCOUNT_ID` with your AWS account id. Then click `Import`. If at this point, you run into some errors, it is possible that the `uri` fields in the above template do not match the path to your lambda functions.

After this, you can navigate back to the API Gateway console, and there should be a new entry for the API Gateway you just created. Click on it, press the `Actions` button towards the top of the page, and click `Deploy API`. A small box should appear asking for more details: in `Deployment stage` click `[New stage]` and type in `predict`, and for `Deployment Description` also put `predict`, and then click `Deploy`.

Now the API is deployed, but there are still a few details. First, click `Resources` on the left side bar, and click `OPTIONS`. You should see the flow of the OPTIONS request come up - click on `Integration Request` and click the pencil icon next to `corsHandlerJs` where it says `Lambda Function`. Then delete the text and type in `corsHandlerJs` and click the gray checkmark - you should see a box pop up saying `Add Permission to Lambda Function`. Click `OK`, and then redeploy the API (`Actions` -> `Deploy API` just like above).

Now the OPTIONS request is working, which you can check by going to any command line and typing in:
```
curl "https://{YOUR_API_GATEWAY_URL}.execute-api.us-west-1.amazonaws.com/predict?model=ts1643060001-newbertvfourteen" -X OPTIONS -H "Origin: https://dynabench.org"
```
where you replace `YOUR_API_GATEWAY_URL` with the `ID` of the API you just created (you can find this on the API Gateway homepage console).

The only remaining steps are:
(1) email/message Dynabench Admins to ask for the model endpoint secret
(2) navigate to the code for the lambda function for `ApiGatewayAuthorizerJs`
(3) put the secret in the array on line 6 of the code
(4) press `Deploy` on the top of the `Code source` panel

and you're done!


### Filling in the rest of the config
To fill the rest of `build_config` in, you can put your AWS account region under `aws_region`. To find this, in the AWS console in the very top bar right next to the account drop down, there will be a region name. Click on it, and it will show the region (it will look something like `us-west-1` or `us-east-1`).

For `DYNABENCH_API`, simply put ` "https://api.dynabench.org"`.

For `decen_eaas_secret`, navigate to your task on the main dynabench website (`https://dynabench.org`). Go to task settings, and check the box that says `"Is this a Decentralized Task?"`. As soon as you check that, a field should appear underneath containing your `decen_eaas_secret`. Copy that string, and paste it into the `build_config`.

## Filling in `eval_config`
Just like `build_config`, we have a config file to run the evaluation server. Much of the work we did to setup `build_config` will be copied over:
1. `cd ~/dynabench/evaluation`
2. Use your favorite text editor to create a file named `eval_config.py` (or just enter `vim eval_config.py`)
3. Paste in the following template:
```
eval_config = {
    "aws_access_key_id": "",
    "aws_secret_access_key": "",
    "aws_region": "",
    "sagemaker_role": "",
    "dataset_s3_bucket": "",
    "evaluation_sqs_queue": "",
    "scheduler_status_dump": "scheduler.dump",
    "computer_status_dump": "computer.dump",
    "max_submission": 20,
    "eval_server_id": "default",
    "compute_metric_processes": 1,
    "DYNABENCH_API": "",
    "task_code": "",
    "decen_eaas_secret": "",
}

```
Fill in `aws_access_key_id`, `aws_secret_access_key`, `aws_region`, `sagemaker_role`, `evaluation_sqs_queue`, `DYNABENCH_API`, and `decen_eaas_secret` as we did above. At this point, we only have two fields left to fill in: `task_code` and `dataset_s3_bucket`.

To fill in `dataset_s3_bucket`, just create an S3 bucket through the AWS console, give it any name, and paste that name into this field.

To fill in `task_code`, navigate to the home page of your task on `https://dynabench.org` and look at the URL - the last portion of the URL will be your `task_code`.

## Running build and evaluation servers
That's it! You're done wih set up. Now we just run the the servers on two screens on your EC2 instance. Specifically:

1. Run `screen -S build`. This will take you into a new screen (you will see your terminal window clear out)
2. Re-activate the conda environment by entering `conda activate dev`
3. Run `cd ~/dynabench/builder`
4. Run `python build_server_decen.py`
5. Exit the screen by pressing the keys `Ctrl-A` followed by `D`

Then run the evaluation server:
1. Run `screen -S eval`. This will take you into a new screen (you will see your terminal window clear out)
2. Re-activate the conda environment by entering `conda activate dev`
3. Run `cd ~/dynabench/evaluation`
4. Run `python eval_server_decen.py`
5. Exit the screen by pressing the keys `Ctrl-A` followed by `D`


Now finally, navigte to your task on `https://dynabench.org` and navigate to the task settings. Ensure the following:
1. `Is this a Decentralized Task?` is checked
2. The name of your build queue is entered in `Build queues`
3. The name of your evaluation queue is entered in `Eval queues`
4. Your AWS account ID is entered in `Task Owner AWS Account ID`
5. Hit `Save` to ensure these changes take place

And that's it! Your task is officially decentralized and your AWS account will handle all the building/evaluation of models. Congrats on making it to the end!
