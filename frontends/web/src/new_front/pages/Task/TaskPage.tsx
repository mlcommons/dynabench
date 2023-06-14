/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import TabOption from "new_front/components/Buttons/TabOption";
import TaskActionButtons from "new_front/components/Buttons/TaskActionButtons_new";
import TaskHelpersButton from "new_front/components/Buttons/TaskHelpersButton";
import { TaskInfoType } from "new_front/types/task/taskInfo";
import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PacmanLoader } from "react-spinners";
import useFetch from "use-http";
import Leaderboard from "new_front/pages/Task/LeaderBoard";
import OverviewTask from "../../components/TaskPage/OverviewTask";
import PrincipalTaskStats from "new_front/components/TaskPage/PrincipalTaskStats";
import UserContext from "containers/UserContext";

const TaskPage = () => {
  const [task, setTask] = useState<TaskInfoType>();
  const [amountOfModels, setAmountOfModels] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(0);
  const [adminOrOwner, setAdminOrOwner] = useState(false);
  const [openTab, setOpenTab] = React.useState(1);
  const [taskInstructions, setTaskInstructions] = useState<any>();
  const [loading, setLoading] = useState(true);
  const { get, post, response } = useFetch();
  const { taskCode } = useParams<{ taskCode: string }>();
  const userContext = useContext(UserContext);
  const { user } = userContext;

  const getTask = async (taskCode: string) => {
    const taskId = await get(`/task/get_task_id_by_task_code/${taskCode}`);
    const [taskData, maxScore, amountOfModels, adminOrOwner, taskInstructions] =
      await Promise.all([
        await get(`/task/get_task_with_round_info_by_task_id/${taskId}`),
        await get(`/score/get_maximun_principal_score_per_task/${taskId}`),
        await get(`/model/get_amount_of_models_per_task/${taskId}`),
        await post("/auth/is_admin_or_owner", {
          task_id: taskId,
          user_id: user.id,
        }),
        await get(`/task/get_task_instructions/${taskId}`),
      ]);
    if (response.ok) {
      setTask(taskData);
      setMaxScore(maxScore.perf);
      setAmountOfModels(amountOfModels);
      setAdminOrOwner(adminOrOwner);
      setTaskInstructions(taskInstructions);
      setLoading(false);
    }
  };

  useEffect(() => {
    getTask(taskCode);
  }, [user]);

  useEffect(() => {
    if (
      task &&
      task.show_user_leaderboard === 0 &&
      task.show_leaderboard === 0
    ) {
      setOpenTab(2);
    }
  }, [task]);

  console.log("task", task);

  return (
    <div>
      {!loading && task ? (
        <>
          <div className="container ">
            <div className="mt-4 border border-gray-200 rounded-lg">
              <div
                className={`grid grid-cols-2 relative bg-no-repeat bg-[50%] bg-cover`}
                style={{
                  backgroundImage: `url(${task?.image_url})`,
                }}
              >
                <div className="bg-[#0000009c] pl-4 ">
                  <div className="col-span-2 pt-4 pl-4">
                    <div className="flex gap-1">
                      <i className="text-white fa fa-users"></i>
                      <p className="text-sm text-white ">
                        {task.challenge_type_name}
                      </p>
                    </div>
                    <h2 className="text-3xl font-medium text-white">
                      {task.name}{" "}
                    </h2>
                    <p className="pb-2 pl-3 text-xl text-white">{task.desc}</p>
                  </div>
                </div>
                <div className="bg-[#0000009c]">
                  <div className="flex items-start justify-end pt-2 pr-4">
                    <TaskHelpersButton
                      taskCode={taskCode}
                      adminOrOwner={adminOrOwner}
                    />
                  </div>
                  <PrincipalTaskStats
                    totalRounds={task.cur_round}
                    totalCollected={task.round.total_collected}
                    maxScore={maxScore}
                    amountOfModels={amountOfModels}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2">
                <div>
                  <ul
                    className="flex flex-row flex-wrap list-none border-t-2"
                    role="tablist"
                  >
                    {(task.show_user_leaderboard !== 0 ||
                      task.show_leaderboard !== 0) && (
                      <TabOption
                        optionTab={1}
                        tabName="Leaderboard"
                        openTab={openTab}
                        setOpenTab={setOpenTab}
                      />
                    )}

                    <TabOption
                      optionTab={2}
                      tabName="Overview"
                      openTab={openTab}
                      setOpenTab={setOpenTab}
                    />
                    {task.documentation_url && (
                      <TabOption
                        optionTab={3}
                        tabName="Documentation"
                        openTab={openTab}
                        documentationUrl={task.documentation_url}
                      />
                    )}
                  </ul>
                </div>
                <div className="flex justify-end pt-1">
                  <TaskActionButtons
                    configYaml={task.config_yaml}
                    dynamicAdversarialDataValidation={Boolean(
                      task.dynamic_adversarial_data_validation
                    )}
                    dynamicAdversarialDataCollection={Boolean(
                      task.dynamic_adversarial_data_collection
                    )}
                    submitable={Boolean(task.submitable)}
                    hasPredictionsUpload={Boolean(task.has_predictions_upload)}
                    taskCode={task.task_code}
                    MLCubeTutorialMarkdown={task.mlcube_tutorial_markdown}
                    submitablePredictions={Boolean(task.submitable_predictions)}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap mt-3">
              <div className="flex-auto">
                <div className="tab-content tab-space">
                  <div className={openTab === 1 ? "block  px-4" : "hidden"}>
                    {(task.show_user_leaderboard !== 0 ||
                      task.show_leaderboard !== 0) && (
                      <Leaderboard
                        taskCode={task.task_code}
                        showLeaderboard={Boolean(task.show_leaderboard)}
                        showTrends={Boolean(task.show_trends)}
                      />
                    )}
                  </div>
                  <div className={openTab === 2 ? "block " : "hidden"}>
                    <OverviewTask
                      roundDescription={task.round?.longdesc}
                      generalDescription={task.instructions_md}
                      taskInstructions={taskInstructions!}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-screen">
          <PacmanLoader color="#ccebd4" loading={loading} size={50} />
        </div>
      )}
    </div>
  );
};
export default TaskPage;
