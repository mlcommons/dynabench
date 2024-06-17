# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os

import paramiko
from fastapi import HTTPException
from scp import SCPClient


class SecureCopyProtocol:
    def __init__(self, server, key_file, user="ubuntu"):
        self.server = server
        self.user = user
        self.key_file = key_file
        self.ssh = self.create_ssh_client()

    def create_ssh_client(self):
        # Create an SSH client
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        # Load the private key
        pkey = paramiko.RSAKey.from_private_key_file(self.key_file)
        # Connect to the server
        ssh.connect(self.server, username=self.user, pkey=pkey)
        return ssh

    def scp_file(self, remote_file, local_path):
        # Create an SCP client
        with SCPClient(self.ssh.get_transport()) as scp:
            # Get the file
            scp.get(remote_file, local_path)
        return local_path

    def copy_pipeline(self, remote_file, local_path):
        try:
            self.ssh.close()

            if os.path.exists(local_path):
                return local_path
            else:
                raise HTTPException(status_code=404, detail="File not found")

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
