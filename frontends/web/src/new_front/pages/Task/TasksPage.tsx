/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useFetch from "use-http";
import TaskCard from "../../components/Cards/TaskCard";
import { TaskInfoType } from "../../types/task/taskInfo";
import { TaskCategories } from "../../types/task/taskCategories";
import { PacmanLoader } from "react-spinners";

const TasksPage = () => {
  const [tasksData, setTasksData] = useState([] as TaskInfoType[]);
  const [tasksCategories, setTasksCategories] = useState<TaskCategories[]>([]);
  const { get, response, loading } = useFetch();

  const getTaskData = async () => {
    const [tasksInfo, tasksCategoriesInfo] = await Promise.all([
      get("/task/get_active_tasks_with_round_info"),
      get("/task/get_tasks_categories"),
    ]);
    if (response.ok) {
      setTasksData(tasksInfo);
      setTasksCategories(tasksCategoriesInfo);
    }
  };

  useEffect(() => {
    getTaskData();
  }, []);

  return (
    <>
      {!loading ? (
        <div className="container">
          <h2 className="text-2xl font-semibold text-center d-block text-letter-color">
            TASKS
          </h2>
          <div className="pb-2">
            <span className="inline-flex items-center px-3 py-1 m-3 rounded-full bg-primary-color">
              <Link
                className="text-lg font-medium text-[#6e6e6e] hover:text-letter-color"
                to="/dadc"
              >
                DADC
              </Link>
            </span>
            <div
              className="grid grid-cols-1 gap-4 pb-2 md:grid-cols-4"
              key="DADC"
            >
              {tasksData
                .filter((t) => t.challenge_type === 1)
                .map((task) => (
                  <div key={task.id}>
                    <TaskCard
                      id={task.id}
                      name={task.name}
                      description={task.desc}
                      curRound={task.cur_round}
                      totalCollected={task.round.total_collected}
                      totalFooled={task.round.total_fooled}
                      taskCode={task.task_code}
                      imageUrl={task.image_url}
                      tasksCategories={tasksCategories}
                    />
                  </div>
                ))}
            </div>
          </div>
          <div className="pb-2 container-fluid">
            <span className="inline-flex items-center px-3 py-1 m-2 rounded-full bg-primary-color ">
              <Link
                className="text-lg font-medium text-[#6e6e6e] hover:text-letter-color"
                to="/dataperf"
              >
                Dataperf
              </Link>
            </span>
          </div>
          <div>
            <div
              className="grid grid-cols-1 gap-4 pb-2 md:grid-cols-4"
              key="Dataperf"
            >
              {tasksData
                .filter((t) => t.challenge_type === 2)
                .map((task) => (
                  <div key={task.id}>
                    <TaskCard
                      id={task.id}
                      name={task.name}
                      description={task.desc}
                      curRound={task.cur_round}
                      totalCollected={task.round.total_collected}
                      totalFooled={task.round.total_fooled}
                      taskCode={task.task_code}
                      imageUrl={task.image_url}
                      tasksCategories={tasksCategories}
                    />
                  </div>
                ))}
            </div>
          </div>
          <div className="pb-2">
            <span className="inline-flex items-center px-3 py-1 m-3 rounded-full bg-primary-color">
              <Link
                className="text-lg font-medium text-[#6e6e6e] hover:text-letter-color"
                to="/others_tasks"
              >
                Others
              </Link>
            </span>
            <div
              className="grid grid-cols-1 gap-4 pb-2 md:grid-cols-4"
              key="others"
            >
              {tasksData
                .filter((t) => t.challenge_type === 4)
                .map((task) => (
                  <div key={task.id}>
                    <TaskCard
                      id={task.id}
                      name={task.name}
                      description={task.desc}
                      curRound={task.cur_round}
                      totalCollected={task.round.total_collected}
                      totalFooled={task.round.total_fooled}
                      taskCode={task.task_code}
                      imageUrl={task.image_url}
                      tasksCategories={tasksCategories}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-screen">
          <PacmanLoader color="#ccebd4" loading={loading} size={50} />
        </div>
      )}
    </>
  );
};

export default TasksPage;
