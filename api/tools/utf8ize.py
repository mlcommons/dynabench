#! /usr/bin/env python
# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import sys

import MySQLdb

from common.config import config


sys.path.append("..")


dbname = config["db_name"]
db = MySQLdb.connect(
    host="localhost",
    user=config["db_user"],
    passwd=config["db_password"],
    db=config["db_name"],
)
cursor = db.cursor()

cursor.execute(
    "ALTER DATABASE `%s` CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'" % dbname
)

sql = (
    "SELECT DISTINCT(table_name) FROM information_schema.columns WHERE "
    + "table_schema = '%s'"
) % dbname
cursor.execute(sql)

results = cursor.fetchall()
for row in results:
    sql = "ALTER TABLE `%s` convert to character set DEFAULT COLLATE DEFAULT" % (row[0])
    cursor.execute(sql)
db.commit()
db.close()
