# TEST YOUR MODEL (speech)
### The instructions for test your model are as follows:

__Install docker__

Download and instal docker using this [link](https://docs.docker.com/engine/install/). Make sure that you have docker runing before following the next steps

__Instal virtualenv__

to install virtualenv run the following command on your terminal
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

once you activate your environment, you have to install mlcube running the following command:
~~~
pip install mlcube-docker
~~~
__putting your model into place__

When the previous step is completed, you will find a directory calls dataperf-speech-example. Access that folder and go to the route selection/selection.py where you are going to find a class call "TrainingSetSelection" with just one method named "select". This metod is the one that you must update and it reciver 2 parameters explained in the docstring.

__Evaluate your model__

The las thing you have to do is run this 3 comands
Keep in mind that the each of this 3 commands will take some minuts.
~~~
# Run download task
mlcube run --task=download -Pdocker.build_strategy=always

# Run select task
mlcube run --task=select -Pdocker.build_strategy=always

# Run evaluate task
mlcube run --task=evaluate -Pdocker.build_strategy=always
~~~
at the end of the execution you will get an output like this:
~~~
score 0.750789054111216
~~~
