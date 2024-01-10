# Dynabench

Dynabench is a research platform for dynamic data collection and benchmarking.

# Development

### 1. Clone the Repository

Go to [Dynabench's repository](https://github.com/mlcommons/dynabench) and clone the repo locally by copying the following command to your terminal:

    git clone https://github.com/mlcommons/dynabench.git
    
This should take a minute to clone, time after which you should be able to head to the dynabench directory on the same terminal using:
    
    cd dynabench

### 2. Basic setup

In order to run Dynabench you'll need to run two different backends and one frontend (as of January, 2024). To run the backends, we recommend using Conda as the environment manager, as it eases managing dependencies. To do so, you can follow the official [Conda tutorial](https://conda.io/projects/conda/en/latest/user-guide/install/index.html).

You'll also need to run a local version of the database, as we cannot provide public access to the main database. This requires installing MySQL, which can be done using the official [MySQL tutorial](https://dev.mysql.com/doc/mysql-installation-excerpt/5.7/en/)

### 3. First Backend

The first backend is located at the  `api` directory, and runs using Bottle's framework. 

First, we'll create a new conda environment. The following command creates a new environment named dynabench_api with Python 3.9.

    conda create -n dynabench_api python=3.9 

Next, we must activate the environment. 
    
    conda activate dynabench_api

Using the `python=3.9` option should install pip, the library we'll be using to install the other dependencies. Nevertheless, to make sure this is the case, you can run `which pip` in the terminal. The path printed in the terminal should include "dynabench_api". If that's not the case, you can install pip manually using `conda install pip`.

Asumming pip was installed correctly, we'll now proceed to install the dependencies for the backend. Run the following.

    cd api
    pip install -r requirements.txt

After all the dependencies are installed, we're only missing two steps: defining the environment variables, and running the server. We've included a `.env.example` file, which should be used to create a new `.env` file in the `api` directory.

Finally, once you've set up all the environment variables, run: 

    python3 server.py dev

After running some migrations, the terminal should output `Listening on http://0.0.0.0:8081/`. We're done with the first backend!

### 4. Second Backend

Running the second backend works very similar to the first one, except we use FastaAPI as the framework. Open another terminal (you don't want to kill the previous API, as both need to be running at the same time for Dynabench to work). Head to dynabench's directory, and once there, head to `backend`. We'll follow the same procedure, creating a new environment and installing the dependencies.

    conda create -n dynabench_backend python=3.9
    conda activate dynabench_backend
    pip install -r requirements.txt

As before, use the `.env.example` file to create a new `.env` file. Once done, you can run the backend using

    uvicorn app.main:app --reload

Once this  is working you'll receive the following message: `INFO:     Application startup complete.`

We just finished setting up both backends. We're just missing the frontend!

### 5. Frontend

To install and run the frontend, we recommend using [nvm](https://github.com/creationix/nvm) (see [here](https://github.com/nvm-sh/nvm#installing-and-updating) for installation instructions) to manage and install node versions, just as we did with Conda for the backend.

Once installed, in a third terminal, head to the `frontends/web` directory. Let's setup our node environment now. Run the following commands:

    nvm install node
    nvm install-latest-npm
    nvm install 18
    npm i --force

After running this, setup the environment variables for the frontend just as before, creating a `.env` file in this directory.




