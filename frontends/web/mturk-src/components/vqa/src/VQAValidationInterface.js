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
import AtomicImage from "../../../../src/containers/AtomicImage.js";
import { WarningMessage } from "./WarningMessage.js";
import { ExampleValidationActions } from "../../../../src/containers/ExampleValidationActions.js";
import { KeyboardShortcuts } from "../../../../src/containers/KeyboardShortcuts.js";
import { ValidQuestionCharacteristics } from "./QuestionsCharacteristics.js";
import ErrorAlert from "../../../../src/containers/ErrorAlert.js";
import { Container, Row, Col, Card, InputGroup, Button } from "react-bootstrap";

class VQAValidationInterface extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    this.vqaTaskId = 12;
    this.batchAmount = 10;
    this.userMode = "user";
    this.interfaceMode = "mturk";
    this.VALIDATION_STATES = {
      CORRECT: "correct",
      INCORRECT: "incorrect",
      VALID: "valid",
      INVALID: "invalid",
      FLAGGED: "flagged",
      UNKNOWN: "unknown",
    };
    this.state = {
      // current task state
      questionValidationState: this.VALIDATION_STATES.UNKNOWN,
      responseValidationState: this.VALIDATION_STATES.UNKNOWN,
      flagReason: null,
      totalValidationsSoFar: new Set(),

      // current task UI state
      showInstructions: false,
      examplesOverError: false,
      submitDisabled: false,
      showErrorAlert: false,

      history: [],
      task: {},
    };
  }

  componentDidMount() {
    this.api.getTask(this.props.taskConfig.task_id).then(
      (result) => {
        this.setState({ task: result }, () => {
          this.state.task.selected_round = this.state.task.cur_round;
          this.getNewExample();
        });
      },
      (error) => {
        console.log(error);
        this.setState({ showErrorAlert: true });
      }
    );
  }

  setQuestionValidationState = (valState) => {
    this.setState({
      questionValidationState: valState,
      responseValidationState: this.VALIDATION_STATES.UNKNOWN,
      flagReason: null,
    });
  };

  setResponseValidationState = (valState) => {
    this.setState({ responseValidationState: valState });
  };

  getNewExample = () => {
    this.api
      .getRandomExample(
        this.vqaTaskId,
        this.state.task.selected_round,
        this.getTagList(this.props),
        this.props.providerWorkerId
      )
      .then(
        (result) => {
          this.setState({
            example: result,

            examplesOverError: false,
            submitDisabled: false,

            questionValidationState: this.VALIDATION_STATES.UNKNOWN,
            responseValidationState: this.VALIDATION_STATES.UNKNOWN,
            flagReason: null,
          });
        },
        (error) => {
          console.log(error);
          this.setState({ examplesOverError: true });
        }
      );
  };

  getTagList(props) {
    if (props.taskConfig && props.taskConfig.fetching_tags) {
      return props.taskConfig.fetching_tags.split(",");
    } else {
      return [];
    }
  }

  submitValidation = () => {
    if (
      this.state.examplesOverError &&
      this.state.totalValidationsSoFar.size > 0
    ) {
      this.props.onSubmit(this.state.history);
      return;
    }

    const questionState = this.state.questionValidationState;
    const responseState = this.state.responseValidationState;

    const UNKNOWN = this.VALIDATION_STATES.UNKNOWN;
    const VALID = this.VALIDATION_STATES.VALID;
    const INCORRECT = this.VALIDATION_STATES.INCORRECT;
    const FLAGGED = this.VALIDATION_STATES.FLAGGED;
    if (
      questionState === UNKNOWN ||
      (questionState === VALID && responseState === UNKNOWN)
    ) {
      return;
    }
    let action = null;
    if (questionState === FLAGGED) {
      action = "flagged";
    } else if (questionState === VALID && responseState === INCORRECT) {
      action = "correct";
    } else {
      action = "incorrect";
    }
    const metadata = {
      annotator_id: this.props.providerWorkerId,
      mephisto_id: this.props.mephistoWorkerId,
      agentId: this.props.agentId,
      assignmentId: this.props.assignmentId,

      flagReason: this.state.flagReason,
      questionValidationState: questionState,
      responseValidationState: responseState,
      example_tags: this.getTagList(this.props),
    };

    this.setState({ submitDisabled: true }, () => {
      this.api
        .validateExample(
          this.state.example.id,
          action,
          this.userMode,
          metadata,
          this.props.providerWorkerId
        )
        .then(
          (result) => {
            this.setState(
              (prevState, _) => {
                const newTotalValidationsSoFar = new Set(
                  prevState.totalValidationsSoFar
                );
                if (prevState.example.id) {
                  newTotalValidationsSoFar.add(prevState.example.id);
                }

                let newHistory = [
                  ...prevState.history,
                  {
                    id: prevState.example.id,
                    questionValidationState: prevState.questionValidationState,
                    responseValidationState: prevState.responseValidationState,
                    flagReason: prevState.flagReason,
                    totalNumValidationsSoFar: newTotalValidationsSoFar.size,
                  },
                ];

                return {
                  totalValidationsSoFar: newTotalValidationsSoFar,
                  history: newHistory,
                };
              },
              () => {
                if (
                  this.state.totalValidationsSoFar.size === this.batchAmount
                ) {
                  this.props.onSubmit(this.state.history);
                } else {
                  this.getNewExample();
                }
              }
            );
          },
          (error) => {
            console.log(error);
            this.setState({ showErrorAlert: true });
          }
        );
    });
  };

  render() {
    const validationInstructions = this.state.showInstructions ? (
      <>
        <p>
          You will be shown an image and a question. The task consists of two
          rounds. First, you have to determine if the question is{" "}
          <b className="dark-principal-color">valid</b>. Most of the questions
          should be valid, as they are produced by hardworking turkers like you!
          Some of the questions require digging into the image a bit more to
          assess its validity. As a reminder, you can use the magnifying glass
          by hovering your mouse over the image to zoom in! If we detect that
          you are labeling really quickly and not investigating the images in
          great detail, we will ban you.
        </p>
        <p>
          A question is considered <b>valid</b> if:
        </p>
        <ValidQuestionCharacteristics />
        <p>
          If you deem the question as valid, next you will determine whether the
          provided answer is <b className="dark-principal-color">correct</b>. If
          you think the example should be reviewed, please click the <b>Flag</b>{" "}
          button and explain why you flagged the example (try to use this
          sparingly). Please flag if you sense that the person asking the
          question has a bad intent.
        </p>
        <p>You can also use the key shortcuts to operate:</p>
        <ul className="mx-3" style={{ listStyleType: "disc" }}>
          <li>
            <b>w:</b> Valid Question.
          </li>
          <li>
            <b>s:</b> Invalid Question.
          </li>
          <li>
            <b>f:</b> Flag Question.
          </li>
          <li>
            <b>a:</b> Incorrect Answer.
          </li>
          <li>
            <b>d:</b> Correct Answer.
          </li>
          <li>
            <b>j:</b> Toggle Show/Hide Instructions.
          </li>
          <li>
            <b>Escape:</b> Clear Selections.
          </li>
          <li>
            <b>Enter:</b> Submit Validation.
          </li>
        </ul>
      </>
    ) : (
      <></>
    );

    let taskInstructionsButton = <></>;
    if (this.state.showInstructions) {
      taskInstructionsButton = (
        <Button
          className="btn btn-info mb-3"
          onClick={() => {
            this.setState({ showInstructions: false });
          }}
        >
          Hide Instructions
        </Button>
      );
    } else {
      taskInstructionsButton = (
        <Button
          className="btn btn-info mb-3"
          onClick={() => {
            this.setState({ showInstructions: true });
          }}
        >
          Show Instructions
        </Button>
      );
    }
    const taskTracker = (
      <small
        style={{ padding: 7 }}
      >{`Validations: ${this.state.totalValidationsSoFar.size} / ${this.batchAmount}.`}</small>
    );

    const UNKNOWN = this.VALIDATION_STATES.UNKNOWN;
    const VALID = this.VALIDATION_STATES.VALID;
    const INVALID = this.VALIDATION_STATES.INVALID;
    const CORRECT = this.VALIDATION_STATES.CORRECT;
    const INCORRECT = this.VALIDATION_STATES.INCORRECT;
    const FLAGGED = this.VALIDATION_STATES.FLAGGED;
    let disableSubmit = this.state.submitDisabled;
    if (
      this.state.questionValidationState === "flagged" &&
      (this.state.flagReason === null ||
        this.state.flagReason.trim().length === 0)
    ) {
      disableSubmit = true;
    }
    if (this.state.examplesOverError) {
      disableSubmit = this.state.totalValidationsSoFar.size === 0;
    }
    return (
      <Container>
        <h4>Validate Examples</h4>
        {taskInstructionsButton}
        {validationInstructions}
        <Row>
          <Card style={{ width: "100%" }}>
            {!this.state.examplesOverError ? (
              this.state.example ? (
                <>
                  <Card.Body
                    className="d-flex justify-content-center pt-2"
                    style={{ height: "auto" }}
                  >
                    <AtomicImage
                      src={this.state.example.context.context}
                      maxHeight={600}
                      maxWidth={900}
                    />
                  </Card.Body>
                  <WarningMessage />
                  <Card className="hypothesis rounded border m-3 card">
                    <Card.Body className="p-3">
                      <Row>
                        <Col xs={12} md={7}>
                          <h6 className="text-uppercase dark-principal-color spaced-header">
                            Is the question below valid? (see instructions above
                            to see what we mean by "valid")
                          </h6>
                          <p>{this.state.example.text}</p>
                          <ExampleValidationActions
                            correctSelected={
                              this.state.questionValidationState === VALID
                            }
                            incorrectSelected={
                              this.state.questionValidationState === INVALID
                            }
                            flaggedSelected={
                              this.state.questionValidationState === FLAGGED
                            }
                            userMode={this.userMode}
                            task={this.state.task}
                            isExplainingAllowed={false}
                            isQuestion={true}
                            isFlaggingAllowed={true}
                            setCorrectSelected={() =>
                              this.setState({
                                questionValidationState: VALID,
                                flagReason: null,
                              })
                            }
                            setIncorrectSelected={() =>
                              this.setState({
                                questionValidationState: INVALID,
                                flagReason: null,
                              })
                            }
                            setFlagSelected={() =>
                              this.setState({
                                questionValidationState: FLAGGED,
                              })
                            }
                            setFlagReason={(flagReason) =>
                              this.setState({ flagReason })
                            }
                          />
                          {this.state.questionValidationState ===
                            this.VALIDATION_STATES.VALID && (
                            <div className="mt-3">
                              <h6 className="text-uppercase dark-principal-color spaced-header">
                                Determine if the answer is correct:
                              </h6>
                              <p>
                                {this.state.example.model_preds.split("|")[0]}
                              </p>
                              <ExampleValidationActions
                                correctSelected={
                                  this.state.responseValidationState === CORRECT
                                }
                                incorrectSelected={
                                  this.state.responseValidationState ===
                                  INCORRECT
                                }
                                flaggedSelected={false}
                                userMode={this.userMode}
                                task={this.state.task}
                                isExplainingAllowed={false}
                                isQuestion={false}
                                isFlaggingAllowed={false}
                                setCorrectSelected={() =>
                                  this.setState({
                                    responseValidationState: CORRECT,
                                    flagReason: null,
                                  })
                                }
                                setIncorrectSelected={() =>
                                  this.setState({
                                    responseValidationState: INCORRECT,
                                    flagReason: null,
                                  })
                                }
                                setFlagSelected={() => {}}
                                setFlagReason={(flagReason) =>
                                  this.setState({ flagReason })
                                }
                              />
                            </div>
                          )}
                        </Col>
                      </Row>
                    </Card.Body>
                    <Card.Footer>
                      <InputGroup className="align-items-center">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={disableSubmit}
                          onClick={this.submitValidation}
                        >
                          Submit
                        </button>
                        {taskTracker}
                      </InputGroup>
                    </Card.Footer>
                  </Card>
                </>
              ) : (
                <Card.Body className="p-3">
                  <Row>
                    <Col xs={12} md={7}>
                      <p>Loading Examples...</p>
                    </Col>
                  </Row>
                </Card.Body>
              )
            ) : (
              <Card>
                <Card.Body className="p-3">
                  <Row>
                    <Col xs={12} md={7}>
                      <p>No more examples to be verified.</p>
                    </Col>
                  </Row>
                </Card.Body>
                <Card.Footer>
                  <InputGroup className="align-items-center">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={disableSubmit}
                      onClick={this.submitValidation}
                    >
                      Submit
                    </button>
                    {taskTracker}
                  </InputGroup>
                </Card.Footer>
              </Card>
            )}
          </Card>
          {this.state.showErrorAlert && <ErrorAlert />}
        </Row>
        <KeyboardShortcuts
          allowedShortcutsInText={["enter", "escape"]}
          mapKeyToCallback={{
            w: {
              callback: (valState) => this.setQuestionValidationState(valState),
              params: VALID,
            },
            s: {
              callback: (valState) => this.setQuestionValidationState(valState),
              params: INVALID,
            },
            f: {
              callback: (valState) => this.setQuestionValidationState(valState),
              params: FLAGGED,
            },
            escape: {
              callback: (valState) => this.setQuestionValidationState(valState),
              params: UNKNOWN,
            },
            d: {
              callback: (valState) => this.setResponseValidationState(valState),
              params: CORRECT,
            },
            a: {
              callback: (valState) => this.setResponseValidationState(valState),
              params: INCORRECT,
            },
            j: {
              callback: () =>
                this.setState((state, props) => {
                  return { showInstructions: !state.showInstructions };
                }),
            },
            enter: {
              callback: () => {
                if (!disableSubmit) {
                  this.submitValidation();
                }
              },
            },
          }}
        />
      </Container>
    );
  }
}

export { VQAValidationInterface };
