## Dynabench Components Overview

Dynabench currently consists of three main components:

### Old Backend

This backend is located in the `API` folder. Currently, the main functionality is the login system. To run this backend, follow these steps:

1. Create a virtual environment (conda or venv can be used) (`python3 -m venv env`).
2. Activate the environment (`source env/bin/activate`).
3. Install the libraries from the `requirements` folder (`python3 -m pip install -r requirements.txt`).
4. Run the command: `python3 server.py dev`.

**Note:** Remember to set the environment variables to run the backend, there is a an example of this file is called .env.example inside the `API` folder.

### New Backend

The new backend is located in the `backend` folder. This is the core of the application, following a hexagonal architecture. It is composed of three main folders inside the `app`:

- **API:** Endpoints reside in this folder. No business logic should be implemented in these endpoints.
- **Domain:** This folder contains all the logic of the functions, both programming and business.
- **Infrastructure:** Here, calls to the database are made using SQLAlchemy.

To install the new backend, follow the same steps as for the API, with the last command being:

`python3 -m uvicorn app.main:app --reload`

**Note:** Remember to set the environment variables to run the backend, there is a an example of this file is called .env.example inside the `backend` folder.

### Frontend

The main frontend is located in the `frontends/web` folder. Inside this folder, you will find a folder called `src/new_front`. About 99% of new changes should be made inside this folder.

To install the frontend, follow these steps:

1. Ensure that Node.js and npm are installed.
2. Run `npm i` (you may need to run it with the `--legacy-peer-deps` flag).
3. Run `npm run start`.

**Note:** Remember to configure the environment variables, there is a an example of this file is called .env.example inside the `frontends/web` folder.

## DB

To migrate the database you can use the following link that comes with some artifacts:

https://models-dynalab.s3.eu-west-3.amazonaws.com/sql/db.sql

## Types of Challenges in Dynabench

Dynabench currently features three different types of challenges:

### Creation of Examples

Challenges falling under this category include PRISM, Wonders, Help-me, and Nibbler. To host the various interface types from the frontend, we utilize the strategy design pattern. Modifying components not adjustable from the YAML file requires specific actions:

1. **Identify the YAML File:** Begin by accessing the YAML of the respective task.

2. **Check Context Type:** Determine the type of context.

3. **Locate Equivalence in Interface Options:** Navigate to `frontends/web/src/new_front/utils/creation_interface_options.json` and find the equivalence of the component used.

4. **Identify Component in Codebase:** Proceed to `frontends/web/src/new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/Contexts` and identify the component.

This process ensures efficient modification of components within the Dynabench platform.
