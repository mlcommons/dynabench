/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useFetch from "use-http";
import TaskCard from "../../components/Cards/TaskCard";
import { TaskInfoType, ChallengeType } from "../../types/task/taskInfo";
import { TaskCategories } from "../../types/task/taskCategories";
import { PacmanLoader } from "react-spinners";
import Carousel from "react-multi-carousel";
import { responsiveCarousel } from "../../utils/constants";
import "react-multi-carousel/lib/styles.css";

const TasksPage = () => {
  const [tasksData, setTasksData] = useState([] as TaskInfoType[]);
  const [tasksCategories, setTasksCategories] = useState<TaskCategories[]>([]);
  const [challengesTypes, setChallengesTypes] = useState([] as ChallengeType[]);
  const { get, response, loading } = useFetch();

  const getTaskData = async () => {
    const [tasksInfo, tasksCategoriesInfo, challengesTypes] = await Promise.all(
      [
        get("/task/get_active_tasks_with_round_info"),
        get("/task/get_tasks_categories"),
        get("/task/get_challenges_types"),
      ]
    );

    if (response.ok) {
      setTasksData(tasksInfo);
      setTasksCategories(tasksCategoriesInfo);
      setChallengesTypes(challengesTypes);
    }
  };

  useEffect(() => {
    getTaskData();
  }, []);

  console.log("tasksData", tasksData);

  return (
    <>
      {!loading ? (
        <div className="container">
          <h2 className="text-4xl font-semibold text-center d-block text-letter-color">
            Communities
          </h2>

          {challengesTypes.map((challengeType) => (
            <div className="pb-2" key={challengeType.id}>
              <span className="inline-flex items-center px-3 py-1 m-3 rounded-full bg-primary-color">
                <Link
                  className="text-lg font-medium text-[#6e6e6e] hover:text-letter-color"
                  to={`/${challengeType.url}`}
                >
                  {challengeType.name}
                </Link>
              </span>
              <div
                className="grid grid-cols-1 gap-4 pb-2 md:grid-cols-1"
                key={challengeType.id}
              >
                <Carousel
                  responsive={responsiveCarousel}
                  key={challengeType.id}
                >
                  {tasksData
                    .filter((t) => t.challenge_type === challengeType.id)
                    .map((task) => (
                      <div key={task.id} className="px-2 py-2">
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
                          isBuilding={task.is_building}
                          isFinished={task.is_finished}
                        />
                      </div>
                    ))}
                </Carousel>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-screen">
          <PacmanLoader color="#ccebd4" loading={loading} size={50} />
          {/* <TasksSkeleton /> */}
        </div>
      )}
    </>
  );
};

export default TasksPage;
