/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from "axios";

const BASE_URL_2 = process.env.REACT_APP_API_HOST_2;

export const getActiveTasksWithRoundInfo = async () => {
  return await axios.get(`${BASE_URL_2}/task/get_active_tasks_with_round_info`);
};

export const getTaskWithRoundInfoByTaskId = async (task_id) => {
  return await axios.get(
    `${BASE_URL_2}/task/get_task_with_round_info_by_task_id/${task_id}`
  );
};

export const getActiveDataperfTasks = async () => {
  return await axios.get(`${BASE_URL_2}/task/get_active_dataperf_tasks`);
};
