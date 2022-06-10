/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Container, Row, Form, Col, Card, Button } from "react-bootstrap";
import { Formik } from "formik";

const Advanced = (props) => {
  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">
        Advanced Settings
      </h1>
      <Col>
        <Card>
          <Card.Body className="mt-4">
            <Formik
              initialValues={{
                config_yaml: props.task.config_yaml,
              }}
              onSubmit={
                props.task.active
                  ? props.handleTaskUpdate
                  : props.handleTaskActivate
              }
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
                      <Form.Group
                        as={Row}
                        controlId="config_yaml"
                        className="py-3 my-0"
                      >
                        <Row>
                          <Form.Label column>Task Configuration</Form.Label>
                          <Col sm="12">
                            <Form.Text id="paramsHelpBlock" muted>
                              <span style={{ color: "red" }}>Note</span>:
                              {props.task.active
                                ? " This task has been activated. Therefore, "
                                : " Once this task has been activated, "}
                              the task configuration can no longer be changed
                              except for the following properties:
                              <ul>
                                <li>aggregation_metric.default_weights</li>
                              </ul>
                            </Form.Text>
                          </Col>
                        </Row>
                        <Col sm="12" className="light-gray-bg">
                          <Form.Control
                            as="textarea"
                            defaultValue={values.config_yaml}
                            rows="24"
                            onChange={handleChange}
                            spellCheck={false}
                            style={{ fontSize: 12, fontFamily: "Courier New" }}
                          />
                        </Col>
                        <Form.Text id="paramsHelpBlock" muted>
                          DynaTask configuration strings are YAML objects that
                          specify the input/output format for dataset and model
                          submissions, as well as the fields in the create and
                          validation interfaces. See{" "}
                          <a href="https://github.com/mlcommons/dynabench/blob/main/docs/owners.md">
                            here
                          </a>{" "}
                          for more documentation. Please contact support or open
                          a Github issue if you have any questions.
                        </Form.Text>
                      </Form.Group>
                      {errors.accept && (
                        <Form.Group as={Row} className="py-3 my-0">
                          <Col sm="8">
                            <small className="form-text text-muted">
                              {errors.accept}
                            </small>
                          </Col>
                        </Form.Group>
                      )}
                      <Row className="justify-content-md-center">
                        {dirty &&
                          (props.task.active ? (
                            <Button
                              type="submit"
                              variant="primary"
                              className="text-uppercase my-4"
                              disabled={isSubmitting}
                            >
                              Save
                            </Button>
                          ) : (
                            <Button
                              type="submit"
                              variant="danger"
                              size="lg"
                              className="text-uppercase my-4"
                              disabled={isSubmitting}
                            >
                              Activate Task
                              <br />{" "}
                              <small>
                                (WARNING: You will not be able to change this
                                config while we're in beta beyond the fields
                                listed above)
                              </small>
                            </Button>
                          ))}
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

export default Advanced;
