# Dataperf-Selection-Speech Alpha
Dataperf-Selection-Speech is a benchmark that measures the performance of dataset selection algorithms. The model training component is frozen and participants can only improve the accuracy by selecting the best trainging set. The benchmark is intended to encompass the tasks of dataset cleaning and coreset selection for a keyword spotting application.

The basic workflow:

![Simple workflow](https://docs.google.com/drawings/d/e/2PACX-1vSlVN0uRWKySxu2ghuRhori-YxnQG859kg7zxan9xKXwarb1lQkRw9qVlnsOGEDqeVImxIplBvPDe5O/pub?w=635&h=416)

### Files

* `train_vectors` : The directory that contains the embedding vectors that can be selected for training. The file structure follows the pattern `train_vectors/en/left.parquet`. Each parquet file contains a "clip_id" column and a "mswc_embedding_vector" column.

* `eval_vectors` : The directory that contains the embedding vectors that are used for evaluation. The structure is identical to `train_vectors`

* `allowed_train_set.yaml` : A file that specifies which sample IDs are valid training samples. The file contrains the following structure `{"targets": {"left":[list]}, "nontargets": [list]}`

* `eval.yaml` : The evaluation set for eval.py. It follows the same structure as `allowed_train_set.yaml`.
* `train.yaml` : The file produced by `selection:main` that specifies the training set for eval.py.  It follows the same structure as `allowed_train_set.yaml`

* `dataperf_speech_config.yaml` : This file contains the configuration for the dataperf-speech-example workflow.

#### Optional Files

* `mswc_vectors` : The unified directory of all embedding vectors. This directory can be used to generate new `train_vectors` and `eval_vectors` directories.

* `train_audio` : The directory of wav files that can optionally be used in the selection algorithm.

On the evaluation server, we will have distinct, hidden versions of files using different keywords in different languages, in order to calculate the official score for our leaderboard. This ensures the submitted selection algoithm can generalize to other words and languages. We encurage participants to test out other target words to ensure their solution generalizes. **[TODO: provide link to scoring function]**

#### File Diagram
![File Diagram](https://docs.google.com/drawings/d/e/2PACX-1vS2OAQYU6T4E2FB0lvkW3kf4nGLfbVNAjQm0wXA0XwSy6g9hDOH8BivPg9GW4NdSIDvFRhhg-LtyE2H/pub?w=960&h=720)

### Developing a custom training set selection algorithm

Edit the function `select()` in `selection/selection.py` to include your custom training set selection algorithm.

If your code has additional dependencies, make sure to edit `requirements.txt` and/or the `Dockerfile` to include these.  Please make sure not to change the behavior of `selection/main.py` or the docker entrypoint (this is how we automate evaluation on the server).

You can run your selection algorithm locally (outside of docker) with the following command:

```
python -m selection.main \
  --allowed_training_set ../experiment/allowed_training_set.yaml \
  --train_embeddings_dir ../experiment/train_embeddings/ \
  --outdir ../experiment/
```

This will write out `train.yaml` into the directory specified by `--outdir` (which can be the same `experiment/` directory).

To evaluate your training set run:

```
python eval.py \
  --eval_embeddings_dir ../experiment/eval_embeddings/ \
  --train_embeddings_dir ../experiment/train_embeddings/ \
  --allowed_training_set ../experiment/allowed_training_set.yaml \
  --eval_file ../experiment/eval.yaml \
  --train_file ../experiment/train.yaml \
  --config_file config_files/dataperf_speech_config.yaml

```

### Generating new experiments for development and testing

The following script can generate new experiments with custom words:

```
mkdir ../new_experiment
python create_experiment.py \
  --path_to_metadata /path/to/metadata.json.gz \
  --language_isocode en \
  --path_to_splits_csv /path/to/en_splits.csv \
  --path_to_embeddings /path/to/embeddings/en/ \
  --target_words weather,date,time,schedule,reminder \
  --outdir ../new_experiment

```

MSWC metadata is [available here](https://storage.googleapis.com/public-datasets-mswc/metadata.json.gz)

MSWC train/dev/test splits can be downloaded at <https://mlcommons.org/words>. For example, English splits are [available here](https://storage.googleapis.com/public-datasets-mswc/splits/en.tar.gz)

MSWC embeddings can be downloaded here: **TBD: public link coming soon, currently available to alpha participants**

### Creating a submission

Once you have implemented your selection algorithm, build a new version of your submission container:

```
docker build -t dataperf-speech-submission:latest .
```

Test your submission container before submitting to the evaluation server. To do so, first create a working directory the output of the selection script

```
mkdir workdir
```

Then run your selection algorithm within the docker container:

```
docker run --rm  -u $(id -u):$(id -g) --network none -v $(pwd)/config_files:/config_files -v $(pwd)/workdir:/workdir -v $(path to embeddings):/embeddings -it dataperf-speech-submission:latest
```

There are several flags to note:

* `-u $(id -u):$(id -g)`: These flags are used so that the selection yaml (`train.yaml`) is written to disk as the user instead of as root
* `-v $(pwd)/workdir:/workdir -v $(pwd)/embeddings:/embeddings`: these are a [mounted volumes](https://docs.docker.com/storage/volumes/), specifying the working directory used for the train.yaml output and the directory of the training vectors dataset.
* `--network none`: your submission docker container will not have network access during evaluation on the server. This is to prevent exposing our hidden evaluation keyword.

Finally, test out the evaluation script on your selection algorithm's output (we will use the same `eval.py` script on the server, but with a different hidden `samples.pb` and `eval.pb` dataset)

```
python eval.py --eval_file=eval.yaml --train_file=workdir/train.yaml
```

#### Using .wav Files for Selection

To use the raw audio in selection.py in addition to the embedding vectors:

* Download [the .wav version of the MSWC dataset](TODO).
* Pass the MSWC audio directory to selection:main as the `audio_dir` argument.
* Access the raw audio of a sample in selection.py with the `['audio']` label

### Submitting to the evaluation server
**Submission instructions will be shared directly with participants during the Alpha**


### Glossary

* Keyword spotting model (KWS model): Also referred to as a wakeword, hotword, or voice trigger detection model, this is a small ML speech model that is designed to recognize a small vocabulary of spoken words or phrases (e.g., Siri, Google Voice Assistant, Alexa)
* Target sample: An example 1-second audio clip of a keyword used to train or evaluate a keyword-spotting model
* Nontarget sample: 1-second audio clips of words which are outside of the KWS model's vocabulary, used to train or measure the model's ability to minimize false positive detections on non-keywords.
* MSWC dataset: the [Multilingual Spoken Words Corpus](https://mlcommons.org/words), a dataset of 340,000 spoken words in 50 languages.
* Embedding vector representation: An n-dimensional vector which provides a feature representation of an audio word. We have trained a large classifier on keywords in MSWC, and we provide a 1024-element feature vector by using the penultimate layer of the classifer.
<!-- Other embeddings, such as [wav2vec2](https://huggingface.co/docs/transformers/model_doc/wav2vec2) are also available **[TODO: we may provide a flag for users to select which embedding they wish to use for training and evaluation, or we may restrict to only one embedding - TBD]** -->
