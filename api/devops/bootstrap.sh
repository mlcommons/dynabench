#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Steps:
# - Check dependencies
# - Kill running servers
# - Launch new ones

BACKEND_SERVER_WINDOW_NAME=API_SERVER
ROOT_DIR=`pwd`/..
API_DIR=$ROOT_DIR/api
FRONTEND_DIR=$ROOT_DIR/frontends/web

# 1. PRELIMINARY CHECKS
# Deps: nvm, python3, mysql5.7
function check_installed () {
  if [ $1 = "nvm" ]; then
    . ~/.nvm/nvm.sh
  fi
  command -v $1 > /dev/null
  if [ $? -eq 0 ]; then
    echo "$1 installed"
    if [ $1 = "mysql" ]; then
      echo "checking mysql"
      SYSTEM_MYSQL_VERSION=$(mysql --version | awk '{print $5}')
      if [[ $SYSTEM_MYSQL_VERSION == *"5.7"* ]]; then
        echo "$1 version 5.7 found."
      else
        echo "$1 incorrect version.. exiting"
	exit 1
      fi
    fi
  else
    echo "$1 not found.. exiting"
    exit 1
  fi
}
check_installed nvm
check_installed python3
check_installed mysql

# 2. CLONE REPO
#read -p "Git username:" username
#read -p "Git password:" token
#eval "git clone https://$username:$token@github.com/facebookresearch/dynabench.git"
git checkout main
git pull

# 3. MORE CHECKS
function check_file_exists() {
  if [ ! -f $1 ];then
    echo "$1 missing.. exiting"
    exit 1
  fi
}
function check_dir_exists() {
  if [ ! -d $1 ];then
    echo "$1 missing.. exiting"
    exit 1
  fi
}
check_file_exists $ROOT_DIR/requirements.txt
check_file_exists $API_DIR/common/config.py
check_file_exists $FRONTEND_DIR/.env
check_dir_exists $ROOT_DIR/logs
check_dir_exists $API_DIR/data

# 4. RELAUNCH BACKEND
cd $ROOT_DIR
rm -rf ~/.local # to avoid segfault
pip3 install -U pip setuptools wheel
python -mpip install Cython numpy
pip3 install -r requirements.txt --no-cache-dir
cd $API_DIR
screen -S $BACKEND_SERVER_WINDOW_NAME -X quit
screen -mdS $BACKEND_SERVER_WINDOW_NAME bash -c 'python3 server.py prod; exec bash'
echo "sleeping for a bit.." && sleep 10
response=`curl -s -o /dev/null --write-out %{http_code} -H 'Origin:https://www.dynabench.org/' http://localhost:8080`
if [[ $response == 200 ]]; then
  echo "API server started successfully"
else
  echo "API server down ($response)"
fi

# 5. RELAUNCH FRONTEND
cd $FRONTEND_DIR
npm install
npm run build
if [ -e /var/run/nginx.pid ]; then
  echo "nginx running"
else
  echo "WARNING: nginx does not seem to be running"
fi
