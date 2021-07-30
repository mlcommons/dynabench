/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Row, Container, Button, InputGroup } from "react-bootstrap";

import { ValidateInterface } from "./ValidateInterface.js";
class QAValidationTaskPreview extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <>
        <h1>Validate Questions for Reading Comprehension</h1>
        <p>
          In this task, you will be asked to validate whether a span of
          text is the correct answer to a given question.
        </p>
      </>
    );
  }
}

class QAValidationTaskOnboarder extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <>
      </>
    )
  }
}

class TaskInstructions extends React.Component {
  render() {
    return (
      <>
        <br />
        <small>
          Below, you are shown a question, and a passage of text. A candidate
          answer to the question is highlighted in the passage. Please mark
          whether the answer is correct or not. If the selected answer is
          incorrect and the correct answer is not in the context, then flag this
          example.
        </small>
        <br />
      </>
    );
  }
}

class QAValidationTaskMain extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    this.state = { showInstructions: true };
    this.showInstructions = this.showInstructions.bind(this);
  }
  showInstructions() {
    this.setState({ showInstructions: !this.state.showInstructions });
  }
  render() {
    console.log(this.props);
    return (
      <>
        <Container>
          <Row>
            <h2>Does the highlighted span correctly answer the question?</h2>{" "}
            &nbsp; &nbsp;{" "}
            <Button className="btn" onClick={this.showInstructions}>
              {this.state.showInstructions ? "Hide" : "Show"} instructions{" "}
            </Button>
          </Row>
          {this.state.showInstructions && (
            <Row>
              {" "}
              <TaskInstructions />{" "}
            </Row>
          )}
          <br />
        </Container>
        <ValidateInterface api={this.api} {...this.props} />
      </>
    );
  }
}

export {
  QAValidationTaskPreview,
  QAValidationTaskOnboarder,
  QAValidationTaskMain,
};