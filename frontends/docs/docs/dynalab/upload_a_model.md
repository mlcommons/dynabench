---
sidebar_position: 2
---

# Uploading Your Model to Dynabench

Welcome to the exciting journey of contributing your model to Dynabench! Follow these engaging steps to showcase your AI prowess:

## Step 1: Download Dynalab 2.0

Download and unzip the Dynalab 2.0 project on your computer. This project is your gateway to unleashing the power of your model in the Dynabench ecosystem.

## Step 2: Navigate the Repository

Explore the project repository, and you'll encounter a folder named `app`. Inside, discover three key folders: `api`, `domain`, and `resources`. The `api` holds logic you won't need to touch, while `resources` is your designated space for storing model components. Dive into the `domain` folder, specifically locating the `model.py` file.

## Step 3: Customize Evaluation Functions

In the `model.py` file, find the `ModelController` class. Feel free to clear out unnecessary code, focusing on updating the `constructor`, `single_evaluation`, and `batch_evaluation` methods. These are the key functions where your model's magic happens.

## Step 4: Add Dependencies

Ensure your model's dependencies are listed in the `requirements.txt` file. Don't remove any existing libraries already included.

## Step 5: Test Your Model

Verify everything works seamlessly by running the following commands:

```bash
python3 -m venv env
source env/bin/activate
python3 -m pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload
```

Open localhost:8000/docs in your favorite browser, where the FastAPI interface awaits. Test your model by clicking on the single evaluation method, hitting 'Try it out,' filling the request body, and executing. A 200 code response means you're all set!

## Step 6: Zip and Upload

Once testing is successful, zip the entire repository. Now, use the 'Upload model' button below and click 'Submit Model.' Congratulations! You've officially submitted your model to Dynabench, making waves in the world of AI challenges.
