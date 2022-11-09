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
  Col,
  Container,
  Row,
  Jumbotron,
  Table,
  Button,
  Card,
  CardGroup,
  Modal,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import UserContext from "./UserContext";
import TasksContext from "./TasksContext";
import "./HomePage.css";
import Moment from "react-moment";
import ReactPlayer from "react-player";
import { OverlayProvider, BadgeOverlay } from "./Overlay";

class TaskCard extends React.Component {
  render() {
    const task = this.props.task;
    return (
      <Col sm={6} lg={3} key={task.id} className="mb-3">
        <Card
          key={task.id}
          className={`${
            task.dataperf
              ? "dataperf"
              : !task.official
              ? "contributed"
              : "original"
          } task-card`}
          onClick={this.props.onClick}
        >
          <h2 className="task-header principal-color text-uppercase text-center">
            {task.name} {task.dataperf ? "🗃️" : !task.official ? "🦾" : "🤖"}
          </h2>
          <Card.Body>
            <Card.Text className="text-center">{task.desc}</Card.Text>
            <Table>
              <thead></thead>
              <tbody>
                <tr>
                  <td>Round:</td>
                  <td>{task.cur_round}</td>
                </tr>
                <tr>
                  <td>Model error rate:</td>
                  <td>
                    {task.round.total_collected > 0
                      ? (
                          (100 * task.round.total_fooled) /
                          task.round.total_collected
                        ).toFixed(2)
                      : "0.00"}
                    % ({task.round.total_fooled}/{task.round.total_collected})
                  </td>
                </tr>
                <tr>
                  <td>Last activity:</td>
                  <td>
                    <Moment utc fromNow>
                      {task.last_updated}
                    </Moment>
                  </td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Col>
    );
  }
}

class HomePage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      showjumbo: true,
      tasks: [],
      showVideo: false,
    };
    this.hideJumbo = this.hideJumbo.bind(this);
  }
  componentDidMount() {
    if (this.context.api.loggedIn()) {
      this.context.api.getAsyncBadges().then(
        (result) => {
          if (!!result.badges) {
            this.setState({ showBadges: result.badges });
          }
        },
        (error) => {
          console.log(error);
        }
      );
    }
  }
  hideJumbo() {
    this.setState({ showjumbo: false });
  }
  render() {
    return (
      <OverlayProvider initiallyHide={true}>
        <BadgeOverlay
          badgeTypes={this.state.showBadges}
          show={!!this.state.showBadges}
          onHide={() => this.setState({ showBadges: "" })}
        ></BadgeOverlay>
        <>
          <Jumbotron
            className={
              "pb-0 bg-white jumbo-slider " +
              (this.state.showjumbo ? "" : "hide-jumbo")
            }
          ></Jumbotron>
          <Container className="pb-4 pb-sm-5">
            <h2 className="home-cardgroup-header text-reset mt-0 mb-4 font-weight-light d-block text-center">
              Tasks
            </h2>
            <TasksContext.Consumer>
              {({ tasks }) =>
                tasks && (
                  <>
                    <CardGroup>
                      {tasks
                        .filter((t) => t.official)
                        .map((task, index) => (
                          <TaskCard
                            task={task}
                            key={index}
                            onClick={() =>
                              this.props.history.push(
                                `/tasks/${task.task_code}`
                              )
                            }
                          />
                        ))}
                    </CardGroup>
                    <br />
                    {/*
                    <center>
                      <u>Contributed tasks</u>
                    </center>
                    <br />
                    */}
                    <CardGroup id="contributed-tasks">
                      {tasks
                        .filter((t) => !t.official)
                        .map((task, index) => (
                          <TaskCard
                            task={task}
                            key={index}
                            onClick={() =>
                              this.props.history.push(
                                `/tasks/${task.task_code}`
                              )
                            }
                          />
                        ))}
                    </CardGroup>
                  </>
                )
              }
            </TasksContext.Consumer>
          </Container>
        </>
      </OverlayProvider>
    );
  }
}

export default HomePage;
