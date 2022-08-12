#!/bin/bash

python eval.py \
  --eval_embeddings_dir ${eval_embeddings_dir} \
  --train_embeddings_dir ${train_embeddings_dir} \
  --allowed_training_set ${allowed_training_set} \
  --eval_file ${eval_file} \
  --train_file ${train_file} \
  --config_file ${config_file} 2>&1 | tee ${log_path}
