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

import React, { useEffect, useState } from "react";
import {
  Button,
  ButtonGroup,
  Col,
  Container,
  Row,
  Spinner,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import useFetch from "use-http";
import { useParams } from "react-router-dom";
import {
  Annotation,
  OverlayContext,
  OverlayProvider,
} from "../../../containers/Overlay";
import TaskActionButtons from "../../components/Buttons/TaskActionButtons";
import OverallTaskStats from "../../components/TaskPage/OverallTaskStats";
import {
  TaskModelDefaultLeaderboard,
  TaskModelForkLeaderboard,
} from "../../../components/TaskLeaderboard/TaskModelLeaderboardCardWrapper";
import UserLeaderboardCard from "../../../components/TaskPageComponents/UserLeaderboardCard";
import TaskTrend from "../../components/TaskPage/TaskTrend";

const BASE_URL = process.env.REACT_APP_API_HOST;
const yaml = require("js-yaml");

const TaskPage2 = () => {
  const [task, setTask] = useState({});
  const [trendScore, setTrendScore] = useState([]);
  const [admin_or_owner, setAdminOrOwner] = useState(false);

  const { get: getOldBackend, loading } = useFetch(BASE_URL);
  const { get: getNewBackend } = useFetch();

  const { taskCode } = useParams();

  const getTask = async (taskCode) => {
    const taskId = await getNewBackend(
      `/task/get_task_id_by_task_code/${taskCode}`
    );

    const [taskData, trendScore] = await Promise.all([
      getNewBackend(`/task/get_task_with_round_info_by_task_id/${taskId}`),
      getOldBackend(`/tasks/${taskId}/trends`),
    ]);
    setTask(taskData);
    setTrendScore(trendScore);
  };

  useEffect(() => {
    getTask(taskCode);
  }, []);

  const hasTrainFileUpload = false;

  return (
    <OverlayProvider initiallyHide={true} delayMs="1700">
      <Container>
        <Row>
          <Col />
          <div className="text-center">
            <h2 className="pt-6 text-2xl font-medium text-center d-block text-letter-color">
              {task.name}{" "}
            </h2>
          </div>
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
              curRound={task.cur_round}
              round={task.round}
              lastUpdated={task.last_updated}
            />
          </Annotation>
        </Row>
        <Row className="justify-content-center">
          {task?.active && (
            <TaskActionButtons
              config_yaml={task.config_yaml}
              dynamicAdversarialDataCollection={
                task.dynamic_adversarial_data_collection
              }
              submitable={task.submitable}
              hasPredictionsUpload={task.has_predictions_upload}
              taskCode={task.task_code}
              taskDocumentationUrl={task.documentation_url}
            />
          )}
        </Row>
        <Row className="justify-content-center">
          <Col xs={12} md={12}>
            <div
              dangerouslySetInnerHTML={{
                __html: task.round?.longdesc,
              }}
            ></div>
          </Col>
        </Row>
        {loading ? (
          <>
            {task?.active ? (
              <>
                {task && (
                  <Row className="justify-content-center">
                    <Col xs={12} md={12}>
                      <Annotation
                        placement="left"
                        tooltip="This shows how models have performed on this task - the top-performing models are the ones we’ll use for the next round"
                      >
                        {this.props.match?.params.forkOrSnapshotName ? (
                          <TaskModelForkLeaderboard
                            {...this.props}
                            task={task}
                            taskCode={taskCode}
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
                            {...this.props}
                            task={task}
                            taskCode={taskCode}
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
                )}
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
                      <>
                        <Annotation
                          placement="top-end"
                          tooltip="As tasks progress over time, we can follow their trend, which is shown here"
                        >
                          <>
                            <TaskTrend trendScore={trendScore} />
                          </>
                        </Annotation>
                      </>
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
  );
};

export default TaskPage2;
