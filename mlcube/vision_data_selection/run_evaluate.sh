#!/bin/bash

ln -sf ${eval_path} ./data
python3 main.py 2>&1 | tee ${log_path}
