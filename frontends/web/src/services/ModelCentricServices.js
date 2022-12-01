/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from "axios";

const BASE_URL_2 = process.env.REACT_APP_API_HOST_2;

export const createBatchSamples = (formData, modelUrl) => {
  return axios.post(`${BASE_URL_2}/model_centric/batch_prediction`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    params: {
      model_url: modelUrl,
    },
  });
};
