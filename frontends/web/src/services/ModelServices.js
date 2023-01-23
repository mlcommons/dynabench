/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from "axios";

const BASE_URL_2 = process.env.REACT_APP_API_HOST_2;

export const getModelInTheLoop = (task_id) => {
  return axios.post(`${BASE_URL_2}/model/get_model_in_the_loop`, {
    task_id,
  });
};

export const uploadModelToS3AndEvaluate = (formData) => {
  return axios.post(
    `${BASE_URL_2}/model/upload_model_to_s3_and_evaluate`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};
