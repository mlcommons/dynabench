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
import { Container, Row, Col, Card, InputGroup, Button } from "react-bootstrap";

class VerifyInterface extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    this.state = {
      taskId: null,
      task: {},
      example: {},
    };
    this.getNewExample = this.getNewExample.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
  }
  componentDidMount() {
    this.setState({ taskId: this.props.taskConfig.task_id }, function () {
      this.api.getTask(this.state.taskId).then(
        (result) => {
          result.targets = result.targets.split("|"); // split targets
          this.setState({ task: result }, function () {
            this.state.task.selected_round = this.state.task.cur_round;
            this.getNewExample();
          });
        },
        (error) => {
          console.log(error);
        }
      );
    });
  }
  getNewExample() {
    this.api
      .getRandomExample(this.state.taskId, this.state.task.cur_round)
      .then(
        (result) => {
          if (this.state.task.type !== "extract") {
            result.target =
              this.state.task.targets[parseInt(result.target_pred)];
          }
          this.setState({
            example: result,
          });
        },
        (error) => {
          console.log(error);
          this.setState({
            example: false,
          });
        }
      );
  }
  handleResponse(action) {
    var action_label = null;
    switch (action) {
      case "correct":
        action_label = "C";
        break;
      case "incorrect":
        action_label = "I";
        break;
      case "flag":
        action_label = "F";
        break;
    }
    if (action_label !== null) {
      this.setState({ label: action_label });
      this.api
        .validateExample(
          this.state.example.id,
          action_label,
          this.props.providerWorkerId
        )
        .then(
          (result) => {
            this.props.onSubmit(this.state.content);
          },
          (error) => {
            console.log(error);
          }
        );
    }
  }
  render() {
    return (
      <Container className="mb-5 pb-5">
        <Col className="m-auto" lg={12}>
          {this.state.task.shortname === "Hate Speech" ? (
            <p className="mt-3 p-3 light-red-bg rounded white-color">
              <strong>WARNING</strong>: This is sensitive content! If you do not
              want to see any hateful examples, please switch to another task.
            </p>
          ) : null}
          <Card className="profile-card overflow-hidden">
            <div className="mb-1 p-3 light-gray-bg">
              <h6 className="text-uppercase dark-principal-color spaced-header">
                Context:
              </h6>
              {this.state.example.context &&
                this.state.example.context.context.replace("<br>", "\n")}
            </div>
            <Card.Body className="overflow-auto pt-2" style={{ height: 400 }}>
              <Card
                className="hypothesis rounded border m-3 card"
                style={{ minHeight: 120 }}
              >
                {this.state.example ? (
                  <>
                    <Card.Body className="p-3">
                      <Row>
                        <Col xs={12} md={7}>
                          {this.state.task.type == "extract" ? (
                            <div className="mb-3">
                              <h6 className="text-uppercase dark-principal-color spaced-header">
                                Question:
                              </h6>
                              <p>{this.state.example.text}</p>
                              <h6 className="text-uppercase dark-principal-color spaced-header">
                                Answer:
                              </h6>
                              <p>{this.state.example.target_pred}</p>
                            </div>
                          ) : (
                            <div className="mb-3">
                              <h6 className="text-uppercase dark-principal-color spaced-header">
                                {this.state.task.shortname === "NLI"
                                  ? "Hypothesis"
                                  : "Statement"}
                                :
                              </h6>
                              <p>{this.state.example.text}</p>
                              <h6 className="text-uppercase dark-principal-color spaced-header">
                                Label:
                              </h6>
                              <p>{this.state.example.target}</p>
                            </div>
                          )}
                        </Col>
                      </Row>
                    </Card.Body>
                    <Card.Footer>
                      <button
                        data-index={this.props.index}
                        onClick={() => this.handleResponse("correct")}
                        type="button"
                        className="btn btn-light btn-sm"
                      >
                        <i className="fas fa-thumbs-up"></i> Correct
                      </button>{" "}
                      <button
                        data-index={this.props.index}
                        onClick={() => this.handleResponse("incorrect")}
                        type="button"
                        className="btn btn-light btn-sm"
                      >
                        <i className="fas fa-thumbs-down"></i> Incorrect
                      </button>{" "}
                      <button
                        data-index={this.props.index}
                        onClick={() => this.handleResponse("flag")}
                        type="button"
                        className="btn btn-light btn-sm"
                      >
                        <i className="fas fa-flag"></i> Flag
                      </button>{" "}
                    </Card.Footer>
                  </>
                ) : (
                  <Card.Body className="p-3">
                    <Row>
                      <Col xs={12} md={7}>
                        <p>No more examples to be verified!</p>
                      </Col>
                    </Row>
                  </Card.Body>
                )}
              </Card>
            </Card.Body>
          </Card>
        </Col>
      </Container>
    );
  }
}

export { VerifyInterface };
