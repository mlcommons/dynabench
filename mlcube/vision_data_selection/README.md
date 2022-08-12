__Install docker__

Download and install docker using this [link](https://docs.docker.com/engine/install/). Make sure that you have docker runing before following the next steps.

__Instal virtualenv__

To install virtualenv run the following command on your terminal
~~~
pip install virtualenv
~~~
__Create and activate virtual enviroment__

In order to create and activate a virtual environment running the following commands:
~~~
virtualenv -p python3 ./env
source ./env/bin/activate
~~~
__Install mlcube runner__

Once you activate your environment, you have to install mlcube running the following command:
~~~
pip install mlcube-docker
~~~
__putting your model into place__

When the previous step is completed, you will find a directory called dataperf-vision-selection. Access that folder and go to the route selection.py where you are going to find a class call "Predictor" with a method named "selection". This metod is the one that you must update.

__Evaluate your model__

The last thing you have to do is run this 3 commands. Keep in mind that the each of this 3 commands will take some minutes.
~~~
# Run download task
mlcube run --task=download -Pdocker.build_strategy=always

# Run select task
mlcube run --task=select -Pdocker.build_strategy=always

# Run evaluate task
mlcube run --task=evaluate -Pdocker.build_strategy=always
~~~
At the end of the execution you will get an output like this:
~~~
{
    "Cupcake": {
        "accuracy": 0.5401459854014599,
        "recall": 0.463768115942029,
        "precision": 0.5517241379310345,
        "f1": 0.5039370078740157
    },
    "Hawk": {
        "accuracy": 0.296551724137931,
        "recall": 0.16831683168316833,
        "precision": 0.4857142857142857,
        "f1": 0.25000000000000006
    },
    "Sushi": {
        "accuracy": 0.5185185185185185,
        "recall": 0.6261682242990654,
        "precision": 0.638095238095238,
        "f1": 0.6320754716981132
    }
}

~~~
