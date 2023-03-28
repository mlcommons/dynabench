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

  console.log(task);

  return (
    <div>
      {!loading ? (
        <>
          {task && (
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
                          <svg
                            fill="#ffffff"
                            viewBox="0 0 64 64"
                            xmlns="http://www.w3.org/2000/svg"
                            stroke="#ffffff"
                            className="w-5"
                          >
                            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                            <g
                              id="SVGRepo_tracerCarrier"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            ></g>
                            <g id="SVGRepo_iconCarrier">
                              {" "}
                              <title></title>{" "}
                              <g data-name="Lampu Belajar" id="Lampu_Belajar">
                                {" "}
                                <path d="M52,61H12a1,1,0,0,1-1-1V52a1,1,0,0,1,1-1H52a1,1,0,0,1,1,1v8A1,1,0,0,1,52,61ZM13,59H51V53H13Z"></path>{" "}
                                <path d="M36.54,51.84a1,1,0,0,1-.71-.29L32.29,48a1,1,0,0,1,0-1.41L46.44,32.45a1,1,0,0,1,1.41,0L51.38,36a1,1,0,0,1,0,1.41L37.24,51.55A1,1,0,0,1,36.54,51.84ZM34.41,47.3l2.13,2.12L49.26,36.7l-2.12-2.12Z"></path>{" "}
                                <path d="M47.61,31.68a1,1,0,0,1-.71-.3L32.76,17.24a1,1,0,0,1,0-1.41l3.53-3.54a1,1,0,0,1,1.42,0L51.85,26.44a1,1,0,0,1,.29.7,1,1,0,0,1-.29.71l-3.54,3.53A1,1,0,0,1,47.61,31.68ZM34.88,16.54,47.61,29.26l2.12-2.12L37,14.41Z"></path>{" "}
                                <path d="M22.4,32.2a1,1,0,0,1-.8-.4L7.2,12.6a1,1,0,0,1-.09-1A1,1,0,0,1,8,11H28a1,1,0,0,1,.8.4,1,1,0,0,1,.16.88l-5.6,19.2a1,1,0,0,1-.78.7A.55.55,0,0,1,22.4,32.2ZM10,13,22,29l4.67-16Z"></path>{" "}
                                <path d="M52,35a3,3,0,1,1,3-3A3,3,0,0,1,52,35Zm0-4a1,1,0,1,0,1,1A1,1,0,0,0,52,31Z"></path>{" "}
                                <path d="M32,15a3,3,0,1,1,3-3A3,3,0,0,1,32,15Zm0-4a1,1,0,1,0,1,1A1,1,0,0,0,32,11Z"></path>{" "}
                                <path d="M34,53H30a1,1,0,0,1-1-1,3,3,0,0,1,6,0A1,1,0,0,1,34,53Zm-2-2h0Z"></path>{" "}
                                <path d="M15,29a7,7,0,0,1-3.82-12.87,1,1,0,0,1,1.35.24L19.71,26a1,1,0,0,1-.14,1.36A7,7,0,0,1,15,29ZM11.54,18.39a5,5,0,0,0,6,8Z"></path>{" "}
                              </g>{" "}
                            </g>
                          </svg>
                          <p className=" text-sm text-[#b6b6b5]">Dataperf</p>
                        </div>
                        <h2 className="text-3xl font-medium text-white">
                          {task.name}{" "}
                        </h2>
                        <p className="pb-2 pl-3 text-xl text-white">
                          {task.desc}
                        </p>
                      </div>
                    </div>
                    <div className="bg-[#0000009c]">
                      <div className="flex items-start justify-end pt-2 pr-4">
                        <TaskHelpersButton
                          taskCode={taskCode}
                          adminOrOwner={adminOrOwner}
                        />
                      </div>
                      <div className="grid grid-rows-2 pl-32">
                        <div className="grid items-center justify-end grid-cols-2 px-8 py-4">
                          <div className="text-center ">
                            <h6 className="text-3xl font-bold text-white">
                              {task.cur_round}
                            </h6>
                            <p className="text-sm font-medium tracking-widest text-white uppercase ">
                              Rounds
                            </p>
                          </div>
                          <div className="text-center ">
                            <h6 className="text-3xl font-bold text-white">
                              {task.round.total_collected}
                            </h6>
                            <p className="text-sm font-medium tracking-widest text-white uppercase ">
                              Examples
                            </p>
                          </div>
                        </div>
                        <div className="grid items-center justify-end grid-cols-2 px-8 py-4">
                          <div className="text-center ">
                            <h6 className="text-3xl font-bold text-white">
                              {task.round.total_fooled}
                            </h6>
                            <p className="text-sm font-medium tracking-widest text-white uppercase ">
                              Fooled examples
                            </p>
                          </div>
                          <div className="text-center ">
                            <h6 className="text-3xl font-bold text-white">
                              12
                            </h6>
                            <p className="text-sm font-medium tracking-widest text-white uppercase ">
                              Models
                            </p>
                          </div>
                        </div>
                      </div>
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
                        {/* <Leaderboard taskCode={task.task_code} /> */}
                        Lorem ipsum dolor sit amet consectetur adipisicing elit.
                        Nesciunt, dolores, pariatur nisi sit eveniet commodi
                        tenetur error laboriosam similique rerum atque eum sequi
                        quasi. Quis explicabo delectus in enim quam!
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
