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
import React, { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { PacmanLoader } from "react-spinners";
import useFetch from "use-http";
import Leaderboard from "new_front/pages/Task/LeaderBoard";

const TaskPage = () => {
  const [task, setTask] = useState<TaskInfoType>();
  const [adminOrOwner, setAdminOrOwner] = useState(false);
  const [openTab, setOpenTab] = React.useState(1);
  const { get, loading } = useFetch();

  const { taskCode } = useParams<{ taskCode: string }>();

  const getTask = async (taskCode: string) => {
    const taskId = await get(`/task/get_task_id_by_task_code/${taskCode}`);
    const taskData = await get(
      `/task/get_task_with_round_info_by_task_id/${taskId}`
    );
    setTask(taskData);
  };

  useEffect(() => {
    getTask(taskCode);
  }, []);

  return (
    <div>
      {!loading ? (
        <>
          {task && (
            <>
              <div className="container ">
                <div className="mt-4 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-3 gap-1 relative bg-opacity-25 bg-no-repeat bg-cover bg-[url(https://d2p5o30oix33cf.cloudfront.net/assets/sentiment-analysis.jpg)]">
                    <div className="col-span-2">
                      <div className="">
                        <h2 className="text-2xl font-medium text-white">
                          {task.name}{" "}
                        </h2>
                      </div>
                      <p className="pb-4 pl-3 text-base text-white">
                        {task.desc}
                      </p>
                      <p className="pb-4 pl-3 text-base text-white">
                        Some metrics are not available for this task.
                      </p>
                    </div>
                    <div className="flex items-start justify-end pt-2 pr-4">
                      <TaskHelpersButton
                        taskCode={taskCode}
                        adminOrOwner={adminOrOwner}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2">
                    <div>
                      <ul
                        className="flex flex-row flex-wrap list-none border-t-2"
                        role="tablist"
                      >
                        <TabOption
                          optionTab={1}
                          tabName="Leaderboard"
                          openTab={openTab}
                          setOpenTab={setOpenTab}
                        />
                        <TabOption
                          optionTab={2}
                          tabName="Overview"
                          openTab={openTab}
                          setOpenTab={setOpenTab}
                        />
                        <TabOption
                          optionTab={3}
                          tabName="Documentation"
                          openTab={openTab}
                          setOpenTab={setOpenTab}
                        />
                      </ul>
                    </div>
                    <div className="flex justify-end pt-1">
                      <TaskActionButtons
                        configYaml={task.config_yaml}
                        dynamicAdversarialDataCollection={
                          task.dynamic_adversarial_data_collection
                        }
                        submitable={task.submitable}
                        hasPredictionsUpload={task.has_predictions_upload}
                        taskCode={task.task_code}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap mt-3">
                  <div className="flex-auto px-4">
                    <div className="tab-content tab-space">
                      <div className={openTab === 1 ? "block" : "hidden"}>
                        <Leaderboard taskCode={task.task_code} />
                        {/* Lorem ipsum dolor sit amet consectetur adipisicing elit.
                        Nesciunt, dolores, pariatur nisi sit eveniet commodi
                        tenetur error laboriosam similique rerum atque eum sequi
                        quasi. Quis explicabo delectus in enim quam! */}
                      </div>
                      <div className={openTab === 2 ? "block" : "hidden"}>
                        <Row className="justify-content-center">
                          <Col xs={12} md={12}>
                            <div
                              dangerouslySetInnerHTML={{
                                __html: task.round?.longdesc,
                              }}
                            ></div>
                          </Col>
                        </Row>
                      </div>
                      <div className={openTab === 3 ? "block" : "hidden"}>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit.
                        Nesciunt, dolores, pariatur nisi sit eveniet commodi
                        tenetur error laboriosam similique rerum atque eum sequi
                        quasi. Quis explicabo delectus in enim quam! Lorem ipsum
                        dolor sit amet consectetur adipisicing elit. Nesciunt,
                        dolores, pariatur nisi sit eveniet commodi tenetur error
                        laboriosam similique rerum atque eum sequi quasi. Quis
                        explicabo delectus in enim quam! Lorem ipsum dolor sit
                        amet consectetur adipisicing elit. Nesciunt, dolores,
                        pariatur nisi sit eveniet commodi tenetur error
                        laboriosam similique rerum atque eum sequi quasi. Quis
                        explicabo delectus in enim quam!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
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
