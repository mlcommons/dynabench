# `dataperf-vision-selection`: A Data-Centric Visual Benchmark for Training Data Selection
### **Current version:** alpha
This github repo serves as the starting point for offline evaluation of submissions for the training data selection visual benchmark. The offline evaluation can be run on both your local environment as well as a containerized image for reproducibility of score results.

For a detailed summary of the a benchmark, refer to the provided [benchmark documentation](https://docs.google.com/document/d/15ACh9pNn16GjgJKVRuBHhtiIMhhRIMkd_yPjFyb9JcE/edit?usp=sharing).

*Note that permission is required to view the benchmark documentation and download the required resources. Please contact dataperf@coactive.ai to request access.*

## Requirements
### Download resources
The following resources will need to be downloaded locally in order to run offline evaluation:
- Embeddings for candidate pool of training images (.parquet file)
- Test sets for each classification task (.parquet files)

These resources can be downloaded in a .zip file at the following url

```
https://drive.google.com/drive/folders/181uI-7NFJwK3IOPy2kOYVIQS4vZOC02A?usp=sharing
```

### Install dependencies
For running as a containerized image:
- `docker` for building the containerized image
- `docker-compose` for running the scoring service with the appropriate resources

Installation instructions can be found at the following links: [Docker](https://docs.docker.com/get-docker/), [Docker compose](https://docs.docker.com/compose/install/)

For running locally:
- Python (>= 3.7)
- An [appropriate version of Java](https://spark.apache.org/docs/latest/) for your version of `python` and `pyspark`

The current version of this repo has only been tested locally on python 3.9 and java openjdk-11.


## Installation

Clone this repo to your local machine

```
git clone git@github.com:CoactiveAI/dataperf-vision-selection.git
```

If you want to run the offline evaluation in your local environment, install the required python packages

```
pip install -r dataperf-vision-selection/requirements.txt
```

A template filesystem with the following structure is provided in the repo. Move the embeddings file and the tests sets to the appropriate folders in this template filesystem

```
unzip dataperf-vision-selection-resources.zip
mv dataperf-vision-selection-resources/embeddings/* dataperf-vision-selection/data/embeddings/
mv dataperf-vision-selection-resources/test_sets/* dataperf-vision-selection/data/test_sets/
```

The resulting filesystem in the repo should look as follows
```
|____data
| |____embeddings
| | |____train_emb_256_dataperf.parquet
| |____test_sets
| | |____alpha_test_set_Hawk_256.parquet
| | |____alpha_test_set_Cupcake_256.parquet
| | |____alpha_test_set_Sushi_256.parquet
| |____train_sets
| | |____random_500.csv
| |____results
| | |____result_for_random_500.json
```

With the resources in place, you can now test that the system is functioning as expected.

To test the containerized offline evaluation, run

```
cd dataperf-vision-selection
docker-compose up
```

Similarly, to test the local python offline evaluation, run

```
cd dataperf-vision-selection
python3 main.py
```

Either test will run the offline evaluation using the setup specified in `task_setup.yaml`, which will utilize a training set of randomly sampled and labeled data points (`data/train_sets/random_500.csv`) to generate a score results file in `data/results/` with a unique UTC timestamp

```
|____data
| |____results
| | |____result_for_random_500.json
| | |____result_UTC-2022-03-31-20-19-24.json
```

The generated scores in this new results file should be identical to those in `data/results_for_random_500.json`.

# Guidelines (alpha version)
For the alpha version of this benchmark we will only support submissions and offline evaluation for the open division.

## Open Division: Creating a submission
A valid submission for the open division includes the following:
- A description of the data selection algorithm/strategy used
- A training set for each classification task as specified below
- (Optional) A script of the algorithm/strategy used

Each training set file must be a .csv file containing two columns: `ImageID` (the unique identifier for the image) and `Confidence` (the binary label, either a `0` or `1`). The `ImageID`s in the training set files must be limited to the provided candidate pool of training images (i.e. `ImageID`s in the downloaded embeddings file).

The included training set file serves as a template of a single training set:
```
cat dataperf-vision-selection/data/train_sets/random_500.csv

ImageID,Confidence
0002643773a76876,0
0016a0f096337445,0
0036043ce525479b,1
00526f123f84db2f,1
0080db2599d54447,1
00978577e9fdd967,1
...
```

## Open Division: Offline evaluation of a submission

The configuration for the offline evaluation is specified in `task_setup.yaml` file. For simplicity, the repo comes pre-configured such that for offline evaluation you can simply:
1. Copy your training sets to the template filesystem
2. Modify the config file to specify the training set for each task
3. Run offline evaluation
4. See results in stdout and results file in `data/results/`

For example
```
# 1. Copy training sets for each task
cd dataperf-vision-selection
cp /path/to/your/training/sets/Cupcake.csv data/train_sets/
cp /path/to/your/training/sets/Hawk.csv data/train_sets/
cp /path/to/your/training/sets/Sushi.csv data/train_sets/

# 2. task_setup.yaml: modify the training set relative path for each classification task
Cupcake: ['train_sets/Cupcake.csv', 'test_sets/alpha_test_set_Cupcake_256.parquet']
Hawk: ['train_sets/Hawk.csv', 'test_sets/alpha_test_set_Hawk_256.parquet']
Sushi: ['train_sets/Sushi.csv', 'test_sets/alpha_test_set_Sushi_256.parquet']

# 3a. Run offline evaluation (docker)
docker-compose up --build --force-recreate

# 3b. Run offline evaluation (local python)
python3 main.py

# 4. See results (file will have save timestamp in name)
cat data/results/result_UTC-2022-03-31-20-19-24.json

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
```

Though we recommend working as described above, you can specify a custom task setup .yaml file and/or data folder if needed.

For the containerized offline evaluation, modify the following files and run as follows
```
# docker-compose.yaml: modify the volume source
    volumes:
      - path/to/your/data/folder:/app/data

# Dockerfile: modify the COPY *.yaml command and specify the new file in the entrypoint
COPY path/to/your/custom_task_setup.yaml /app/
...
ENTRYPOINT python3 main.py --docker_flag True --setup_yaml_path 'custom_task_setup.yaml'

# Run and force rebuild
docker-compose up --build --force-recreate
```

For the local python offline evaluation, modify the following files and run as follows
```
# path/to/your/custom_task_setup.yaml: modify data_dir
data_dir: 'path/to/your/data/folder'

# Run and specify custom .yaml file
python3 main.py --setup_yaml_path 'path/to/your/custom_task_setup.yaml'
```

*Note: when specifying a data folder, ensure all relative paths in the task setup .yaml file are valid*


## Closed Division: Creating a submission
TBD.


## Closed Division: Offline evaluation of a submission
TBD.
