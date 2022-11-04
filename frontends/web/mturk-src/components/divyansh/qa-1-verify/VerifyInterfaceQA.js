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
  Container,
  Row,
  Col,
  Card,
  InputGroup,
  Button,
  FormControl,
} from "react-bootstrap";

import { TokenAnnotator, TextAnnotator } from "react-text-annotate";

class ContextInfo extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <>
        <TokenAnnotator
          style={{
            lineHeight: 1.5,
          }}
          className="context"
          tokens={this.props.context.split(" ")}
          value={this.props.answer}
        />
      </>
    );
  }
}

class VerifyInterface extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    this.state = {
      taskId: null,
      task: {},
      example: {},
      comment: {},
    };
    this.getNewExample = this.getNewExample.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.setComment = this.setComment.bind(this);
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
  setComment(e) {
    this.setState({ comment: e.target.value });
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
      var metadata = { annotator_id: this.props.providerWorkerId };
      this.api
        .validateExample(this.state.example.id, action, "user", metadata)
        .then(
          (result) => {
            this.props.onSubmit(this.state);
          },
          (error) => {
            console.log(error);
          }
        );
    }
  }
  render() {
    var content;
    if (this.state.example.context) {
      var example_metadata = JSON.parse(this.state.example.metadata_json);
      var ans = JSON.parse(example_metadata["fullresponse"]);
      var ans_start = ans[0].start;
      var ans_end = ans[0].end;
      var answer = [{ start: ans_start, end: ans_end, tag: "ANS" }];
      content = (
        <ContextInfo
          answer={answer}
          context={this.state.example.context.context}
        />
      );
    }
    return (
      <Container className="mb-5 pb-5">
        <Col className="m-auto" lg={12}>
          <Card className="profile-card overflow-hidden">
            <div className="mb-1 p-3 light-gray-bg">
              <h6 className="text-uppercase dark-principal-color spaced-header">
                Context:
              </h6>
              <Card.Body style={{ height: 200, overflowY: "scroll" }}>
                {this.state.example.context && content}
              </Card.Body>
            </div>
            <Card.Body className="overflow-auto pt-2" style={{ height: 300 }}>
              <Card
                className="hypothesis rounded border m-3 card"
                style={{ minHeight: 120 }}
              >
                {this.state.example ? (
                  <>
                    <Card.Body className="p-3">
                      <Row>
                        <Col xs={12} md={7}>
                          <div className="mb-3">
                            <h6 className="text-uppercase dark-principal-color spaced-header">
                              Question:
                            </h6>
                            <p>{this.state.example.text}</p>
                          </div>
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
