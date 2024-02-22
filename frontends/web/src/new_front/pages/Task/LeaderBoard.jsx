/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {
  TaskModelDefaultLeaderboard,
  TaskModelForkLeaderboard,
} from "components/TaskLeaderboard/TaskModelLeaderboardCardWrapper";
import UserLeaderboardCard from "components/TaskPageComponents/UserLeaderboardCard";
import { Annotation, OverlayProvider } from "containers/Overlay";
import UserContext from "containers/UserContext";
import UserLeaderBoardCSV from "new_front/components/Tables/Leaderboard/UserLeaderBoardCSV";
import TaskTrend from "new_front/components/TaskPage/TaskTrend";
import React from "react";
import { Col, Container, Row, Spinner } from "react-bootstrap";

const yaml = require("js-yaml");

class Leaderboard extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      admin_or_owner: false,
      task: {},
      trendScore: [],
      numMatchingValidations: 3,
    };
    this.taskCode = this.props.taskCode;
    this.showLeaderboard = this.props.showLeaderboard;
    this.showTrends = this.props.showTrends;
    this.showUserLeaderboardCSV = this.props.showUserLeaderboardCSV;
    this.getCurrentTaskData = this.getCurrentTaskData.bind(this);
    this.showUserLeaderboard = this.props.showUserLeaderboard;
  }

  getCurrentTaskData() {
    this.setState({ taskCode: this.taskCode }, function () {
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
              if (this.taskCode !== this.state.taskCode) {
                this.props.history.replace({
                  pathname: this.props.location.pathname.replace(
                    `/tasks/${this.taskCode}`,
                    `/tasks/${this.state.taskCode}`,
                  ),
                  search: this.props.location.search,
                });
              }
              this.state.loading = true;
              this.fetchTrend();
            },
          );
          this.context.api.getAdminOrOwner(result.id).then(
            (adminOrOwnerResult) => {
              this.setState({
                admin_or_owner: adminOrOwnerResult.admin_or_owner,
              });
            },
            (error) => {
              console.log(error);
            },
          );
        },
        (error) => {
          console.log(error);
          if (error.status_code === 404 || error.status_code === 405) {
            this.props.history.push("/");
          }
        },
      );
    });
  }

  componentDidMount() {
    this.getCurrentTaskData();
  }

  componentDidUpdate(prevProps) {
    if (this.taskCode !== this.state.taskCode) {
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
      },
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
          {this.state.loading ? (
            <>
              {this.state.task?.active ? (
                <>
                  {this.state.task &&
                    (this.state.task.submitable ||
                      hasTrainFileUpload ||
                      Boolean(this.state.task.submitable_predictions)) && (
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
                                percentageFormat={
                                  yaml.load(this.state.task.config_yaml)
                                    .decimal_format
                                }
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
                      this.state.task.cur_round &&
                      this.showUserLeaderboard && (
                        <Col xs={12} md={12}>
                          <UserLeaderboardCard
                            taskId={this.state.task.id}
                            round={this.state.task.round}
                            cur_round={this.state.task.cur_round}
                            dataValidation={
                              this.state.task
                                .dynamic_adversarial_data_validation
                            }
                          />
                        </Col>
                      )}
                    <Col xs={12} md={6} className="mt-3">
                      {this.state.trendScore.length > 0 && this.showTrends && (
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
                    <Col md={12} className="mt-3">
                      {this.showUserLeaderboardCSV && (
                        <UserLeaderBoardCSV
                          taskId={this.state.task.id}
                          title={
                            yaml.load(this.state.task.config_yaml)
                              .leaderboard_csv_title
                          }
                          leaderboard_description={
                            this.state.task.leaderboard_description
                          }
                        />
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

export default Leaderboard;
