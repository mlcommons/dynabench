/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Formik } from "formik";
import React from "react";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import Markdown from "react-markdown";
const yaml = require("js-yaml");

const Settings = (props) => {
  return (
    <Container className="pb-5 mb-5">
      <h1 className="pt-3 my-4 text-center text-uppercase">Settings</h1>
      <Col>
        <Card>
          <Card.Body className="mt-4">
            <Formik
              initialValues={{
                hidden: props.task.hidden,
                submitable: props.task.submitable,
                dynamic_adversarial_data_validation:
                  props.task.dynamic_adversarial_data_validation,
                dynamic_adversarial_data_collection:
                  props.task.dynamic_adversarial_data_collection,
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
                decen_queue: props.task.decen_queue,
                decen_bucket: props.task.decen_bucket,
                decen_aws_region: props.task.decen_aws_region,
                leaderboard_description: props.task.leaderboard_description,
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
                        <Form.Label column className="text-base">
                          Instructions
                        </Form.Label>
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
                          <Form.Label column className="text-base">
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
                      {props.task.leaderboard_description && (
                        <Form.Group
                          as={Row}
                          controlId="leaderboard_description"
                          className="py-3 my-0"
                        >
                          <Form.Label column className="text-base">
                            Leaderboard instructions
                          </Form.Label>
                          <Col sm="12">
                            <Form.Control
                              as="textarea"
                              defaultValue={values.leaderboard_description}
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
                              <Form.Label column className="text-base">
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
                              <Form.Label column className="text-base">
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
                        <Form.Label column className="text-base">
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
                        <Form.Label column className="text-base">
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
                        <Form.Label column className="text-base">
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
                        <Form.Label column className="text-base">
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
                        controlId="dynamic_adversarial_data_collection"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column className="text-base">
                          Dynamic adversarial data collection
                          <Form.Text id="paramsHelpBlock" muted>
                            Does this task accept dynamic adversarial data
                            collection?
                          </Form.Text>
                        </Form.Label>
                        <Col sm="6">
                          <Form.Check
                            checked={values.dynamic_adversarial_data_collection}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="dynamic_adversarial_data_validation"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column className="text-base">
                          Dynamic adversarial data validation
                          <Form.Text id="paramsHelpBlock" muted>
                            Does this task accept dynamic adversarial data
                            validation?
                          </Form.Text>
                        </Form.Label>
                        <Col sm="6">
                          <Form.Check
                            checked={values.dynamic_adversarial_data_validation}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="num_matching_validations"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column className="text-base">
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
                        <Form.Label column className="text-base">
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
                      <Form.Group
                        as={Row}
                        controlId="is_decen_task"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column className="text-base">
                          Is this a Decentralized Task?
                        </Form.Label>
                        <Col sm="6">
                          <Form.Check
                            checked={values.is_decen_task}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      {values.is_decen_task && (
                        <>
                          <Form.Group
                            as={Row}
                            controlId="bucket_name"
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label column className="text-base">
                              Bucket name
                              <Form.Text id="paramsHelpBlock" muted>
                                Name of your bucket in your AWS account
                              </Form.Text>
                            </Form.Label>
                            <Col sm="6">
                              <Form.Control
                                type="text"
                                defaultValue={values.decen_bucket}
                                onChange={handleChange}
                              />
                            </Col>
                          </Form.Group>
                          <Form.Group
                            as={Row}
                            controlId="aws_region"
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label column className="text-base">
                              AWS region
                              <Form.Text id="paramsHelpBlock" muted>
                                Region of your bucket in your AWS account
                              </Form.Text>
                            </Form.Label>
                            <Col sm="6">
                              <Form.Control
                                type="text"
                                defaultValue={values.decen_aws_region}
                                onChange={handleChange}
                              />
                            </Col>
                          </Form.Group>
                          <Form.Group
                            as={Row}
                            controlId="sqs_queue"
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label column className="text-base">
                              Queue
                              <Form.Text id="paramsHelpBlock" muted>
                                Name of your Queue in your AWS account
                              </Form.Text>
                            </Form.Label>
                            <Col sm="6">
                              <Form.Control
                                type="text"
                                defaultValue={values.decen_queue}
                                onChange={handleChange}
                              />
                            </Col>
                          </Form.Group>
                        </>
                      )}
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
                              className="my-4 submit-btn button-ellipse text-uppercase"
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
