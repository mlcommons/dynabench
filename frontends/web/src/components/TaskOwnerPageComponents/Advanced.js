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

import React, { useState } from "react";
import { Container, Row, Form, Col, Card, Button } from "react-bootstrap";
import { Formik } from "formik";
import useFetch from "use-http";
import yaml from 'js-yaml';

const Advanced = (props) => {
  const { post, response } = useFetch();
  const [ error, setError ] = useState();

  const saveYamlConfig = async (values) => {
    const validation =  validateYamlConfig(values.config_yaml);
    if (validation.valid) {
      await post("task/update_config_yaml", {
        task_id: props.task.id,
        config_yaml: values.config_yaml,
      });
      if (response.ok) {
        window.location.reload();
      }
    } else {
      console.error("Invalid YAML config", validation.error_message);
    }
  };

  const validateYamlConfig = (text) => {
    const errors = {};
    if (!text) {
      errors.error_message = "Required";
      errors.valid = false;
    }  else {
      try {
        yaml.load(text);
        errors.error_message = "";
        errors.valid = true;
      } catch (e) {
        errors.valid = false
        errors.error_message = e.message;
      }
    }
    setError(errors);
    return errors;
  }

  return (
    <Container className="pb-5 mb-5">
      <h1 className="pt-3 my-4 text-center text-uppercase">
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
                props.task.active ? saveYamlConfig : props.handleTaskActivate
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
                  <form noValidate className="px-4" onSubmit={handleSubmit}>
                    <Container>
                      <Form.Group
                        as={Row}
                        controlId="config_yaml"
                        className="py-3 my-0"
                      >
                        <Row>
                          <Form.Label className="text-base" column>
                            Task Configuration
                          </Form.Label>
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
                            isInvalid={error && !error?.valid}
                          />
                          <Form.Control.Feedback type="invalid">
                            <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>
                              {error?.error_message}
                            </pre>
                          </Form.Control.Feedback>
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
                              className="my-4 border-0 text-uppercase font-weight-bold light-gray-bg btn-primary"
                              disabled={isSubmitting}
                              onClick={saveYamlConfig}
                            >
                              Save
                            </Button>
                          ) : (
                            <Button
                              type="submit"
                              variant="danger"
                              size="lg"
                              className="my-4 border-0 text-uppercase font-weight-bold light-gray-bg btn-primary"
                              disabled={isSubmitting}
                            >
                              Activate Task
                              <br />{" "}
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
