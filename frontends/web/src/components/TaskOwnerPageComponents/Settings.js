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

import React, { useContext, useState } from "react";
import { Container, Row, Form, Col, Card, Button } from "react-bootstrap";
import Markdown from "react-markdown";
import { Formik } from "formik";
import UserContext from "../../containers/UserContext";
const yaml = require("js-yaml");

const Settings = (props) => {
  const context = useContext(UserContext);
  const [decentoken, setDecenToken] = useState("");

  context.api.getAPIToken().then((result) => {
    setDecenToken(result.api_token);
  });

  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">Settings</h1>
      <Col>
        <Card>
          <Card.Body className="mt-4">
            <Formik
              initialValues={{
                hidden: props.task.hidden,
                submitable: props.task.submitable,
                instructions_md: props.task.instructions_md,
                unpublished_models_in_leaderboard:
                  props.task.unpublished_models_in_leaderboard,
                num_matching_validations: props.task.num_matching_validations,
                validate_non_fooling: props.task.validate_non_fooling,
                predictions_upload_instructions_md:
                  props.task.predictions_upload_instructions_md,
                build_sqs_queue: props.task.build_sqs_queue,
                eval_sqs_queue: props.task.eval_sqs_queue,
                is_decen_task: props.task.is_decen_task,
                task_aws_account_id: props.task.task_aws_account_id,
                task_gateway_predict_prefix:
                  props.task.task_gateway_predict_prefix,
                mlcube_tutorial_markdown: props.task.mlcube_tutorial_markdown,
                train_file_upload_instructions_md:
                  props.task.train_file_upload_instructions_md,
                context: props.task.context,
              }}
              onSubmit={props.handleTaskUpdate}
            >
              {({
                values,
                errors,
                handleChange,
                handleSubmit,
                isSubmitting,
                dirty,
              }) => (
                <>
                  <form className="px-4" onSubmit={handleSubmit}>
                    <Container>
                      {!!!props.task.active && (
                        <div>
                          <span style={{ color: "red" }}>BETA Notice</span>:
                          Your task is not yet active. Please go to the Advanced
                          settings first to configure your task.
                        </div>
                      )}
                      <Form.Group
                        as={Row}
                        controlId="instructions_md"
                        className="py-3 my-0"
                      >
                        <Form.Label column>Instructions</Form.Label>
                        <Col sm="12">
                          <Form.Control
                            as="textarea"
                            defaultValue={values.instructions_md}
                            rows="12"
                            onChange={handleChange}
                          />
                          <Form.Text id="paramsHelpBlock" muted>
                            <Markdown>
                              The text will be rendered as
                              [markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
                              in the create interface.
                            </Markdown>
                          </Form.Text>
                        </Col>
                      </Form.Group>
                      {props.task.has_predictions_upload && (
                        <Form.Group
                          as={Row}
                          controlId="predictions_upload_instructions_md"
                          className="py-3 my-0"
                        >
                          <Form.Label column>
                            Instructions For Prediction Uploads
                          </Form.Label>
                          <Col sm="12">
                            <Form.Control
                              as="textarea"
                              defaultValue={
                                values.predictions_upload_instructions_md
                              }
                              rows="12"
                              onChange={handleChange}
                            />
                            <Form.Text id="paramsHelpBlock" muted>
                              <Markdown>
                                The text will be rendered as
                                [markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
                                in the prediction submission interface.
                              </Markdown>
                            </Form.Text>
                          </Col>
                        </Form.Group>
                      )}
                      {props.task.config_yaml &&
                        yaml
                          .load(props.task.config_yaml)
                          .hasOwnProperty("train_file_metric") && (
                          <>
                            <Form.Group
                              as={Row}
                              controlId="train_file_upload_instructions_md"
                              className="py-3 my-0"
                            >
                              <Form.Label column>
                                Instructions For Train File Uploads
                              </Form.Label>
                              <Col sm="12">
                                <Form.Control
                                  as="textarea"
                                  defaultValue={
                                    values.train_file_upload_instructions_md
                                  }
                                  rows="12"
                                  onChange={handleChange}
                                />
                                <Form.Text id="paramsHelpBlock" muted>
                                  <Markdown>
                                    The text will be rendered as
                                    [markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
                                    in the train file submission interface.
                                  </Markdown>
                                </Form.Text>
                              </Col>
                            </Form.Group>
                            <Form.Group
                              as={Row}
                              controlId="mlcube_tutorial_markdown"
                              className="py-3 my-0"
                            >
                              <Form.Label column>
                                Instructions For MLCube Tutorial
                              </Form.Label>
                              <Col sm="12">
                                <Form.Control
                                  as="textarea"
                                  defaultValue={values.mlcube_tutorial_markdown}
                                  rows="12"
                                  onChange={handleChange}
                                />
                                <Form.Text id="paramsHelpBlock" muted>
                                  <Markdown>
                                    The text will be rendered as
                                    [markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
                                    in the train file submission interface.
                                  </Markdown>
                                </Form.Text>
                              </Col>
                            </Form.Group>
                          </>
                        )}
                      <Form.Group
                        as={Row}
                        controlId="hidden"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          Hidden
                          <Form.Text id="paramsHelpBlock" muted>
                            Is this task publicly visible?
                          </Form.Text>
                        </Form.Label>
                        <Col sm="6">
                          <Form.Check
                            checked={values.hidden}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="validate_non_fooling"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          Validate Non-Fooling Examples
                          <Form.Text id="paramsHelpBlock" muted>
                            Do we only validate examples that fooled the model,
                            or all of them?
                          </Form.Text>
                        </Form.Label>
                        <Col sm="6">
                          <Form.Check
                            checked={values.validate_non_fooling}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="unpublished_models_in_leaderboard"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          Show Anonymized Unpublished Models in Leaderboard
                          <Form.Text id="paramsHelpBlock" muted>
                            Display all models, or only published ones?
                          </Form.Text>
                        </Form.Label>
                        <Col sm="6">
                          <Form.Check
                            checked={values.unpublished_models_in_leaderboard}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="submitable"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          Submitable
                          <Form.Text id="paramsHelpBlock" muted>
                            Does this task accept model submissions?
                          </Form.Text>
                        </Form.Label>
                        <Col sm="6">
                          <Form.Check
                            checked={values.submitable}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="build_sqs_queue"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          Build queues
                          <Form.Text id="paramsHelpBlock" muted>
                            Name of your Build Queue in your AWS account
                            (Decentralized Task only)
                          </Form.Text>
                        </Form.Label>
                        <Col sm="6">
                          <Form.Control
                            type="text"
                            defaultValue={values.build_sqs_queue}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="eval_sqs_queue"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          Eval queues
                          <Form.Text id="paramsHelpBlock" muted>
                            Name of your Evaluation Queue in your AWS account
                            (Decentralized Task only)
                          </Form.Text>
                        </Form.Label>
                        <Col sm="6">
                          <Form.Control
                            type="text"
                            defaultValue={values.eval_sqs_queue}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="is_decen_task"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          Is this a Decentralized Task?
                        </Form.Label>
                        <Col sm="6">
                          <Form.Check
                            checked={values.is_decen_task}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="task_aws_account_id"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          Task Owner AWS Account ID
                          <Form.Text id="paramsHelpBlock" muted>
                            AWS Account ID in your AWS Account (decentralized
                            setting only)
                          </Form.Text>
                        </Form.Label>
                        <Col sm="6">
                          <Form.Control
                            type="text"
                            defaultValue={values.task_aws_account_id}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="task_gateway_predict_prefix"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          Task Owner AWS API Gateway Predict URL
                          <Form.Text id="paramsHelpBlock" muted>
                            API Gateway ID to interact with Sagemaker Models
                            (decentralized setting only)
                          </Form.Text>
                        </Form.Label>
                        <Col sm="6">
                          <Form.Control
                            type="text"
                            defaultValue={values.task_gateway_predict_prefix}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>

                      {values.is_decen_task && (
                        <Form.Group
                          as={Row}
                          className="py-3 my-0 border-bottom"
                        >
                          <Form.Label column>Decen Eaas Token:</Form.Label>
                          <Col sm="6">
                            <Form.Control disabled value={decentoken} />
                          </Col>
                        </Form.Group>
                      )}
                      <Form.Group
                        as={Row}
                        controlId="num_matching_validations"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          Validation Consensus Minimum
                          <Form.Text id="paramsHelpBlock" muted>
                            Number of agreeing validations for an example to be
                            considered "validated"
                          </Form.Text>
                        </Form.Label>
                        <Col sm="6">
                          <Form.Control
                            type="number"
                            min={0}
                            step={1}
                            defaultValue={values.num_matching_validations}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="context"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          Sampling of Contexts In the Create Interface
                          <Form.Text id="paramsHelpBlock" muted>
                            <p>
                              “uniform”: samples contexts uniformly at random
                            </p>
                            <p>
                              “min”: samples contexts based on how many examples
                              have been created with them (and it samples from
                              the contexts with the fewest examples)
                            </p>
                            <p>
                              “least_fooled”: samples from contexts where the
                              crowdworkers have had the hardest time fooling the
                              model{" "}
                            </p>{" "}
                            <p>
                              “validation_failed” samples from the contexts that
                              were used in examples that failed crowdworker
                              validation
                            </p>
                          </Form.Text>
                        </Form.Label>
                        <Col sm="6">
                          <Form.Control
                            as="select"
                            defaultValue={values.context}
                            onChange={handleChange}
                          >
                            <option value="min">Min</option>
                            <option value="uniform">Uniform</option>
                            <option value="least_fooled">Least fooled</option>
                            <option value="validation_failed">
                              Validation failed
                            </option>
                          </Form.Control>
                        </Col>
                      </Form.Group>
                      <Form.Group as={Row} className="py-3 my-0">
                        <Col sm="6">
                          <small className="form-text text-muted">
                            {errors.accept}
                          </small>
                        </Col>
                      </Form.Group>
                      <Row className="justify-content-md-center">
                        {dirty ? (
                          <Col md={5} sm={12}>
                            <Button
                              type="submit"
                              variant="primary"
                              className="submit-btn button-ellipse text-uppercase my-4"
                              disabled={isSubmitting}
                            >
                              Save
                            </Button>
                          </Col>
                        ) : null}
                      </Row>
                    </Container>
                  </form>
                </>
              )}
            </Formik>
          </Card.Body>
        </Card>
      </Col>
    </Container>
  );
};

export default Settings;
