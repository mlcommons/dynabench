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
import "./TaskPage.css";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  ButtonGroup,
  Nav,
  Table,
  Spinner,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import UserContext from "./UserContext";
import { LineRechart } from "../components/Charts/Rechart";
import Moment from "react-moment";
import { OverlayProvider, Annotation, OverlayContext } from "./Overlay";
import {
  TaskModelDefaultLeaderboard,
  TaskModelForkLeaderboard,
} from "../components/TaskLeaderboard/TaskModelLeaderboardCardWrapper";
import UserLeaderboardCard from "../components/TaskPageComponents/UserLeaderboardCard";
const yaml = require("js-yaml");

const chartSizes = {
  xs: { fontSize: 10 },
  sm: {
    fontSize: 14,
    height: 300,
    left: -30,
    xAxisLeftPadding: 30,
  },
  md: {
    fontSize: 14,
    height: 300,
    left: -20,
    xAxisLeftPadding: 30,
  },
  lg: {
    align: "center",
    fontSize: 14,
    height: 302,
    left: -20,
    xAxisLeftPadding: 50,
  },
  xl: {
    fontSize: 14,
    height: 300,
    left: -20,
    xAxisLeftPadding: 50,
  },
};

const TaskTrend = ({ data }) => {
  return (
    <>
      <Card className="my-4">
        <Card.Header className="p-3 light-gray-bg">
          <h2 className="m-0 text-uppercase text-reset">
            Model Performance vs. Round{" "}
          </h2>
        </Card.Header>
        <Card.Body className="px-1 py-5">
          {/* Mobile / Tablet / Desktop charts */}
          <Col xs={12} className="d-block d-sm-none">
            <LineRechart size={chartSizes.xs} data={data} />
          </Col>
          <Col sm={12} className="d-none d-sm-block d-md-none">
            <LineRechart size={chartSizes.sm} data={data} />
          </Col>
          <Col md={12} className="d-none d-md-block d-lg-none">
            <LineRechart size={chartSizes.md} data={data} />
          </Col>
          <Col lg={12} className="d-none d-lg-block d-xl-none">
            <LineRechart size={chartSizes.lg} data={data} />
          </Col>
          <Col xl={12} className="d-none d-xl-block">
            <LineRechart size={chartSizes.xl} data={data} />
          </Col>
        </Card.Body>
      </Card>
    </>
  );
};

const TaskActionButtons = (props) => {
  function renderTooltip(props, text) {
    return (
      <Tooltip id="button-tooltip" {...props}>
        {text}
      </Tooltip>
    );
  }

  function renderCreateTooltip(props) {
    return renderTooltip(props, "Create new examples where the model fails");
  }
  function renderVerifyTooltip(props) {
    return renderTooltip(
      props,
      "Verify examples where the model may have failed"
    );
  }
  function renderSubmitTooltip(props) {
    return renderTooltip(props, "Submit models for this task");
  }

  const hasTrainFileUpload =
    props.task.config_yaml &&
    yaml.load(props.task.config_yaml).hasOwnProperty("train_file_metric");

  return (
    <Nav className="my-4">
      {props.task.dynamic_adversarial_data_collection && (
        <>
          <Nav.Item className="task-action-btn">
            <Annotation
              placement="bottom"
              tooltip="Click here to get creative and start writing examples that fool the model"
            >
              <OverlayTrigger
                placement="bottom"
                delay={{ show: 250, hide: 400 }}
                overlay={renderCreateTooltip}
              >
                <Button
                  as={Link}
                  className="border-0 blue-color font-weight-bold light-gray-bg"
                  to={`/tasks/${props.taskCode}/create`}
                >
                  <i className="fas fa-pen"></i> Create Examples
                </Button>
              </OverlayTrigger>
            </Annotation>
          </Nav.Item>
          <Nav.Item className="task-action-btn">
            <Annotation
              placement="top"
              tooltip="Click here to see examples created by others, and validate their correctness"
            >
              <OverlayTrigger
                placement="bottom"
                delay={{ show: 250, hide: 400 }}
                overlay={renderVerifyTooltip}
              >
                <Button
                  as={Link}
                  className="border-0 blue-color font-weight-bold light-gray-bg"
                  to={`/tasks/${props.taskCode}/validate`}
                >
                  <i className="fas fa-search"></i> Validate Examples
                </Button>
              </OverlayTrigger>
            </Annotation>
          </Nav.Item>
        </>
      )}
      {props.task.submitable && (
        <Nav.Item className="task-action-btn">
          <Annotation
            placement="right"
            tooltip="Click here to upload your models for this task."
          >
            <OverlayTrigger
              placement="bottom"
              delay={{ show: 250, hide: 400 }}
              overlay={renderSubmitTooltip}
            >
              <Button
                as={Link}
                className="border-0 blue-color font-weight-bold light-gray-bg"
                to={`/tasks/${props.taskCode}/uploadModel`}
              >
                <i className="fas fa-upload"></i> Submit Models
              </Button>
            </OverlayTrigger>
          </Annotation>
        </Nav.Item>
      )}
      {props.task.has_predictions_upload && (
        <Nav.Item className="task-action-btn">
          <Annotation
            placement="top"
            tooltip={
              "Click here to submit your model-generated prediction files"
            }
          >
            <OverlayTrigger
              placement="bottom"
              delay={{ show: 250, hide: 400 }}
              overlay={renderVerifyTooltip}
            >
              <Button
                as={Link}
                className="border-0 blue-color font-weight-bold light-gray-bg"
                to={"/tasks/" + props.taskCode + "/submit_predictions"}
              >
                <i className="fa fa-upload"></i> Submit Prediction Files
              </Button>
            </OverlayTrigger>
          </Annotation>
        </Nav.Item>
      )}
      {hasTrainFileUpload && (
        <>
          <Nav.Item className="task-action-btn">
            <Annotation
              placement="top"
              tooltip={
                "Click here to submit your train files to trigger the training of" +
                " a model and evaluation on our datasets"
              }
            >
              <OverlayTrigger
                placement="bottom"
                delay={{ show: 250, hide: 400 }}
                overlay={renderVerifyTooltip}
              >
                <>
                  <Button
                    as={Link}
                    className="border-0 blue-color font-weight-bold light-gray-bg"
                    to={"/tasks/" + props.taskCode + "/submit_train_files"}
                  >
                    <i className="fa fa-upload"></i> Submit Files
                  </Button>
                </>
              </OverlayTrigger>
            </Annotation>
          </Nav.Item>
          <Nav.Item className="task-action-btn">
            <Annotation
              placement="top"
              tooltip={
                "Click here to submit your train files to trigger the training of" +
                " a model and evaluation on our datasets"
              }
            >
              <OverlayTrigger
                placement="bottom"
                delay={{ show: 250, hide: 400 }}
                overlay={renderVerifyTooltip}
              >
                <>
                  <Button
                    as={Link}
                    className="border-0 blue-color font-weight-bold light-gray-bg"
                    to={"/tasks/" + props.taskCode + "/mlcube_tutorial"}
                  >
                    <i className="fa fa-upload"></i> MLCube Tutorial
                  </Button>
                </>
              </OverlayTrigger>
            </Annotation>
          </Nav.Item>
        </>
      )}
    </Nav>
  );
};

const OverallTaskStats = (props) => {
  return (
    <Table className="w-50 font-weight-bold ml-n2">
      <thead />
      <tbody>
        <tr>
          <td>Current round:</td>
          <td className="text-right">{props.task.cur_round}</td>
        </tr>
        <tr>
          <td>Fooled/Collected (Model Error rate)</td>
          <td className="text-right">
            {props.task.round?.total_fooled}/{props.task.round?.total_collected}{" "}
            (
            {props.task.round?.total_collected > 0
              ? (
                  (100 * props.task.round?.total_fooled) /
                  props.task.round?.total_collected
                ).toFixed(2)
              : "0.00"}
            % )
          </td>
        </tr>
        {props.task.round && (
          <tr>
            <td>Verified Fooled/Collected (Verified Model Error Rate)</td>
            <td className="text-right">
              {props.task.round?.total_verified_fooled}/
              {props.task.round?.total_collected} (
              {props.task.round?.total_collected > 0
                ? (
                    (100 * props.task.round?.total_verified_fooled) /
                    props.task.round?.total_collected
                  ).toFixed(2)
                : "0.00"}
              % )
            </td>
          </tr>
        )}
        <tr>
          <td>Last activity:</td>
          <td className="text-right">
            <Moment utc fromNow>
              {props.task.last_updated}
            </Moment>
          </td>
        </tr>
      </tbody>
    </Table>
  );
};

class RoundDescription extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.getRoundInfo = this.getRoundInfo.bind(this);
  }
  componentDidMount() {
    this.getRoundInfo();
  }
  getRoundInfo() {
    if (this.props.round_id) {
      this.props.api.getTaskRound(this.props.task_id, this.props.round_id).then(
        (result) => {
          this.setState({ round: result });
        },
        (error) => {
          console.log(error);
          if (
            (error.status_code === 404 || error.status_code === 405) &&
            this.props.history
          ) {
            this.props.history.push("/");
          }
        }
      );
    }
  }
  componentDidUpdate(prevProps) {
    if (
      prevProps.task_id !== this.props.task_id ||
      prevProps.round_id !== this.props.round_id
    ) {
      this.getRoundInfo();
    }
  }
  render() {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: this.state.round?.longdesc }}
      ></div>
    );
  }
}

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
    const pwc_logo = (
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
    );
    const name_to_pwc_links = {
      "Question Answering":
        "https://paperswithcode.com/task/question-answering/latest",
      "Natural Language Inference":
        "https://paperswithcode.com/task/natural-language-inference/latest",
      "Hate Speech":
        "https://paperswithcode.com/task/hate-speech-detection/latest",
      "Sentiment Analysis":
        "https://paperswithcode.com/task/sentiment-analysis/latest",
    };
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
              <h2 className="task-page-header text-reset">
                <nobr>
                  {this.state.task.name}{" "}
                  {this.state.task.name in name_to_pwc_links ? (
                    <a href={name_to_pwc_links[this.state.task.name]}>
                      {pwc_logo}
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
              <OverallTaskStats task={this.state.task} />
            </Annotation>
          </Row>
          <Row className="justify-content-center">
            {this.state.task?.active && (
              <TaskActionButtons
                api={this.context.api}
                taskCode={this.state.taskCode}
                user={this.context.user}
                task={this.state.task}
              />
            )}
          </Row>
          <Row className="justify-content-center">
            <Col xs={12} md={12}>
              <RoundDescription
                api={this.context.api}
                task_id={this.state.task.id}
                cur_round={this.state.task.cur_round}
                round_id={this.state.task.cur_round}
              />
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
                        <Annotation
                          placement="top-end"
                          tooltip="As tasks progress over time, we can follow their trend, which is shown here"
                        >
                          <TaskTrend data={this.state.trendScore} />
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
    );
  }
}

export default TaskPage;
