/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useContext, useEffect, useState } from "react";
import {
  Button,
  ButtonGroup,
  Col,
  Container,
  Row,
  Spinner,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  TaskModelDefaultLeaderboard,
  TaskModelForkLeaderboard,
} from "../../components/TaskLeaderboard/TaskModelLeaderboardCardWrapper";
import UserLeaderboardCard from "../../components/TaskPageComponents/UserLeaderboardCard";
import { Annotation, OverlayContext, OverlayProvider } from "../Overlay";
import OverallTaskStats from "./OverallTaskStats";
import TaskActionButtons from "./TaskActionButtons";
import TaskTrend from "./TaskTrend";
import useFetch from "use-http";
import UserContext from "../UserContext";

const TaskPage = ({ taskId }) => {
  const context = useContext(UserContext);
  const [task, setTask] = useState({});

  const { get, loading } = useFetch();

  const loadTask = async () => {
    const [orderMetrics, orderScoringDatasets, task] = await Promise.all([
      get(`/task/get_order_metrics_by_task_id/${taskId}`),
      get(`/task/get_order_scoring_datasets_by_task_id/${taskId}`),
      get(`/task/get_task_with_round_info_by_task_id/${taskId}`),
    ]);

    task.ordered_metrics = orderMetrics;
    task.ordered_scoring_datasets = orderScoringDatasets;
    setTask(task);
  };

  useEffect(() => {
    loadTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const name_to_pwc_links = ["sentiment"];
  const admin_or_owner = true;
  const hasTrainFileUpload = true;
  const trendScore = [];
  return (
    <>
      {loading ? (
        <Row className="justify-content-center">
          <Spinner animation="border" />{" "}
        </Row>
      ) : (
        <OverlayProvider initiallyHide={true} delayMs="1700">
          <Container>
            <Row>
              <Col />
              <Col className="text-center">
                <h2 className="task-page-header text-reset">
                  <nobr>
                    {task.name}{" "}
                    {task.name in name_to_pwc_links ? (
                      <a href={name_to_pwc_links[task.name]}>
                        {" "}
                        <svg height="30" width="30" viewBox="0 0 512 512">
                          <path
                            fill="#21cbce"
                            d="M88 128h48v256H88zm144 0h48v256h-48zm-72 16h48v224h-48zm144 0h48v224h-48zm72-16h48v256h-48z"
                          ></path>
                          <path
                            fill="#21cbce"
                            d="M104 104V56H16v400h88v-48H64V104zm304-48v48h40v304h-40v48h88V56z"
                          ></path>
                        </svg>
                      </a>
                    ) : (
                      ""
                    )}
                  </nobr>
                </h2>
              </Col>
              <Col>
                <div style={{ float: "right", marginTop: 30 }}>
                  <ButtonGroup>
                    <Annotation
                      placement="left"
                      tooltip="Click to show help overlay"
                    >
                      <OverlayContext.Consumer>
                        {({ hidden, setHidden }) => (
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm btn-help-info"
                            onClick={() => {
                              setHidden(!hidden);
                            }}
                          >
                            <i className="fas fa-question"></i>
                          </button>
                        )}
                      </OverlayContext.Consumer>
                    </Annotation>
                    {admin_or_owner && (
                      <Button
                        as={Link}
                        to={`/task-owner-interface/${task.task_code}#settings`}
                        type="button"
                        className="btn btn-light btn-outline-primary btn-sm btn-help-info"
                      >
                        <i className="fas fa-cog"></i>
                      </Button>
                    )}
                  </ButtonGroup>
                </div>
              </Col>
            </Row>
            <Row className="justify-content-center">
              <p>{task.desc}</p>
            </Row>
            <Row className="justify-content-center">
              <Annotation
                placement="right"
                tooltip="This shows the statistics of the currently active round."
              >
                <OverallTaskStats
                  cur_round={task.cur_round}
                  round={task.round}
                  last_updated={task.last_updated}
                />
              </Annotation>
            </Row>
            <Row className="justify-content-center">
              {task?.active && (
                <TaskActionButtons config_yaml={task.config_yaml} />
              )}
            </Row>
            <Row className="justify-content-center">
              <Col xs={12} md={12}>
                <div
                  dangerouslySetInnerHTML={{ __html: task?.round?.longdesc }}
                ></div>
              </Col>
            </Row>
            {task ? (
              <>
                {task?.active ? (
                  <>
                    <Row className="justify-content-center">
                      <Col xs={12} md={12}>
                        <Annotation
                          placement="left"
                          tooltip="This shows how models have performed on this task - the top-performing models are the ones we’ll use for the next round"
                        >
                          {false ? (
                            <TaskModelForkLeaderboard
                              task={task}
                              taskCode={task.task_code}
                              title={
                                hasTrainFileUpload
                                  ? "Coreset Selection Algorithm Leaderboard (Fork)"
                                  : "Model Leaderboard (Fork)"
                              }
                              modelColumnTitle={
                                hasTrainFileUpload ? "Algorithm" : "Model"
                              }
                            />
                          ) : (
                            <TaskModelDefaultLeaderboard
                              task={task}
                              taskCode={task.task_code}
                              title={
                                hasTrainFileUpload
                                  ? "Coreset Selection Algorithm Leaderboard"
                                  : "Model Leaderboard"
                              }
                              modelColumnTitle={
                                hasTrainFileUpload ? "Algorithm" : "Model"
                              }
                            />
                          )}
                        </Annotation>
                      </Col>
                    </Row>

                    <Row>
                      {task.id &&
                        task.dynamic_adversarial_data_collection &&
                        task.round &&
                        task.cur_round && (
                          <Col xs={12} md={6}>
                            <UserLeaderboardCard
                              taskId={task.id}
                              round={task.round}
                              cur_round={task.cur_round}
                            />
                          </Col>
                        )}
                      <Col xs={12} md={6}>
                        {trendScore.length > 0 && (
                          <Annotation
                            placement="top-end"
                            tooltip="As tasks progress over time, we can follow their trend, which is shown here"
                          >
                            <TaskTrend trendScore={trendScore} />
                          </Annotation>
                        )}
                      </Col>
                    </Row>
                  </>
                ) : (
                  <Row className="justify-content-center">
                    The task owner still needs to activate this task
                  </Row>
                )}
              </>
            ) : (
              <Row className="justify-content-center">
                <Spinner animation="border" />{" "}
              </Row>
            )}
          </Container>
        </OverlayProvider>
      )}
    </>
  );
};
export default TaskPage;
