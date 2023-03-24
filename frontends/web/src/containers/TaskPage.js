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

import React from "react";
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
} from "../components/TaskLeaderboard/TaskModelLeaderboardCardWrapper";
import UserLeaderboardCard from "../components/TaskPageComponents/UserLeaderboardCard";
import TaskActionButtons from "../new_front/components/Buttons/TaskActionButtons";
import OverallTaskStats from "../new_front/components/TaskPage/OverallTaskStats";
import TaskTrend from "../new_front/components/TaskPage/TaskTrend";
import { Annotation, OverlayContext, OverlayProvider } from "./Overlay";
import "./TaskPage.css";
import UserContext from "./UserContext";

const yaml = require("js-yaml");

class TaskPage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      admin_or_owner: false,
      taskCode: props.match.params.taskCode,
      task: {},
      trendScore: [],
      numMatchingValidations: 3,
    };

    this.getCurrentTaskData = this.getCurrentTaskData.bind(this);
  }

  getCurrentTaskData() {
    this.setState({ taskCode: this.props.match.params.taskCode }, function () {
      this.context.api.getTask(this.state.taskCode).then(
        (result) => {
          this.setState(
            {
              taskCode: result.task_code,
              task: result,
              round: result.round,
              loading: false,
            },
            function () {
              if (this.props.match.params.taskCode !== this.state.taskCode) {
                this.props.history.replace({
                  pathname: this.props.location.pathname.replace(
                    `/tasks/${this.props.match.params.taskCode}`,
                    `/tasks/${this.state.taskCode}`
                  ),
                  search: this.props.location.search,
                });
              }
              this.state.loading = true;
              this.fetchTrend();
            }
          );
          this.context.api.getAdminOrOwner(result.id).then(
            (adminOrOwnerResult) => {
              this.setState({
                admin_or_owner: adminOrOwnerResult.admin_or_owner,
              });
            },
            (error) => {
              console.log(error);
            }
          );
        },
        (error) => {
          console.log(error);
          if (error.status_code === 404 || error.status_code === 405) {
            this.props.history.push("/");
          }
        }
      );
    });
  }

  componentDidMount() {
    this.getCurrentTaskData();
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.taskCode !== this.state.taskCode) {
      this.getCurrentTaskData();
    }
  }

  fetchTrend() {
    this.context.api.getTrends(this.state.task.id).then(
      (result) => {
        this.setState({
          trendScore: result,
        });
      },
      (error) => {
        console.log(error);
      }
    );
  }

  render() {
    const hasTrainFileUpload =
      this.state.task.config_yaml &&
      yaml
        .load(this.state.task.config_yaml)
        .hasOwnProperty("train_file_metric");
    return (
      <OverlayProvider initiallyHide={true} delayMs="1700">
        <Container>
          <Row>
            <Col />
            <Col className="text-center">
              <h2 className="pt-6 text-2xl font-medium text-center d-block text-letter-color">
                <nobr>{this.state.task.name} </nobr>
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
                  {this.state.admin_or_owner && (
                    <Button
                      as={Link}
                      to={`/task-owner-interface/${this.state.task.task_code}#settings`}
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
            <p>{this.state.task.desc}</p>
          </Row>
          <Row className="justify-content-center">
            <Annotation
              placement="right"
              tooltip="This shows the statistics of the currently active round."
            >
              <OverallTaskStats
                curRound={this.state.task.cur_round}
                round={this.state.task.round}
                lastUpdated={this.state.task.last_updated}
              />
            </Annotation>
          </Row>
          <Row className="justify-content-center">
            {this.state.task?.active && (
              <TaskActionButtons
                configYaml={this.state.task.config_yaml}
                dynamicAdversarialDataCollection={
                  this.state.task.dynamic_adversarial_data_collection
                }
                submitable={this.state.task.submitable}
                hasPredictionsUpload={this.state.task.has_predictions_upload}
                taskCode={this.state.task.task_code}
              />
            )}
          </Row>
          <Row className="justify-content-center">
            <Col xs={12} md={12}>
              <div
                dangerouslySetInnerHTML={{
                  __html: this.state.task.round?.longdesc,
                }}
              ></div>
            </Col>
          </Row>
          {this.state.loading ? (
            <>
              {this.state.task?.active ? (
                <>
                  {this.state.task && (
                    <Row className="justify-content-center">
                      <Col xs={12} md={12}>
                        <Annotation
                          placement="left"
                          tooltip="This shows how models have performed on this task - the top-performing models are the ones we’ll use for the next round"
                        >
                          {this.props.match?.params.forkOrSnapshotName ? (
                            <TaskModelForkLeaderboard
                              {...this.props}
                              task={this.state.task}
                              taskCode={this.state.taskCode}
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
                              task={this.state.task}
                              taskCode={this.state.taskCode}
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
                    {this.state.task.id &&
                      this.state.task.dynamic_adversarial_data_collection &&
                      this.state.task.round &&
                      this.state.task.cur_round && (
                        <Col xs={12} md={6}>
                          <UserLeaderboardCard
                            taskId={this.state.task.id}
                            round={this.state.task.round}
                            cur_round={this.state.task.cur_round}
                          />
                        </Col>
                      )}
                    <Col xs={12} md={6}>
                      {this.state.trendScore.length > 0 && (
                        <>
                          <Annotation
                            placement="top-end"
                            tooltip="As tasks progress over time, we can follow their trend, which is shown here"
                          >
                            <>
                              <TaskTrend trendScore={this.state.trendScore} />
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
  }
}

export default TaskPage;
