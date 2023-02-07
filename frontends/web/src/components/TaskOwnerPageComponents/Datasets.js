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
  Form,
  Col,
  Card,
  Button,
  Spinner,
} from "react-bootstrap";
import { Formik } from "formik";
import DragAndDrop from "../DragAndDrop/DragAndDrop";
const yaml = require("js-yaml");

const FileUpload = (props) => {
  return props.values[props.filename] ? (
    <div className="UploadResult">
      <Card>
        <Card.Body>
          <Container>
            <Row>
              <Col md={10}>{props.values[props.filename].name}</Col>
              <Col md={2}>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={(event) => {
                    props.setFieldValue(props.filename, null);
                  }}
                >
                  Delete
                </Button>
              </Col>
            </Row>
          </Container>
        </Card.Body>
      </Card>
    </div>
  ) : (
    <DragAndDrop
      handleChange={(event) => {
        props.setFieldValue(props.filename, event.currentTarget.files[0]);
      }}
    >
      Drag
    </DragAndDrop>
  );
};

const Datasets = (props) => {
  const config = yaml.load(props.task.config_yaml);
  const delta_metric_configs = config.delta_metrics ? config.delta_metrics : [];
  const delta_files = {};
  for (const config of delta_metric_configs) {
    delta_files[config.type] = null;
  }
  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">Datasets</h1>
      <Col>
        <Card className="my-4">
          <Card.Body>
            <Formik
              initialValues={Object.assign(
                {
                  file: null,
                  name: "",
                },
                delta_files
              )}
              onSubmit={props.handleUploadAndCreateDataset}
            >
              {({
                values,
                errors,
                handleChange,
                setFieldValue,
                handleSubmit,
                isSubmitting,
                setValues,
                dirty,
              }) => (
                <>
                  <form className="px-4" onSubmit={handleSubmit}>
                    <Container>
                      <Form.Group as={Row} className="py-3 my-0 border-bottom">
                        <Form.Label className="text-base" column>
                          Add a new dataset by uploading it here. Files should
                          be a jsonl where each line has fields that match the
                          model inputs and outputs for your task. There should
                          also be an additional field called "uid" that maps to
                          a value which is unique for each line. This "uid"
                          field makes it possible for Dynabench to match
                          unordered model predictions to the correct examples.
                          If you are uploading fairness and/or robustness files,
                          you can use this script{" "}
                          <a href="https://github.com/mlcommons/dynabench/blob/main/evaluation/scripts/perturb.py">
                            here
                          </a>{" "}
                          to generate them, or you can upload your own. Files
                          for fairness and robustness need to have every field
                          that the normal files have (including “uid”), but they
                          must also have an additional field: “input_id”.
                          “input_id” should be the “uid” of the original
                          example, before a fairness or robustness perturbation.
                          <br />
                          <br />
                          Some metrics also allow datasets to have targets that
                          are formatted differently than model outputs, for the
                          same field name. For example, the SQuAD F1 metric
                          allows datasets to have a target with a list of
                          strings (for multiple potential answer candidates),
                          even though the corresponding model output for that
                          field name is a single string.
                        </Form.Label>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="name"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label className="text-base" column>
                          Name
                        </Form.Label>
                        <Col sm={8}>
                          <Form.Control
                            value={values.name}
                            onChange={handleChange}
                            placeholder="[a-zA-Z0-9-]{1,62}"
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group as={Row} className="py-3 my-0">
                        <Form.Label className="text-base" column>
                          File
                        </Form.Label>
                        <Col sm={8}>
                          <FileUpload
                            values={values}
                            filename={"file"}
                            setFieldValue={setFieldValue}
                          />
                        </Col>
                      </Form.Group>
                      {delta_metric_configs.map((config, index) => (
                        <Form.Group
                          key={index}
                          as={Row}
                          className="py-3 my-0 border-top"
                        >
                          <Form.Label className="text-base" column>
                            File for {config.type}
                          </Form.Label>
                          <Col sm={8}>
                            <FileUpload
                              values={values}
                              filename={config.type}
                              setFieldValue={setFieldValue}
                            />
                          </Col>
                        </Form.Group>
                      ))}
                      <Form.Group as={Row} className="py-3 my-0">
                        <Col sm="12">
                          <small className="form-text text-muted">
                            {errors.accept}
                          </small>
                        </Col>
                      </Form.Group>
                      <Row className="justify-content-md-center">
                        <Col md={5} sm={12}>
                          {dirty &&
                          values.file &&
                          !delta_metric_configs
                            .map((config) => values[config.type])
                            .includes(null) &&
                          values.name !== "" ? (
                            <Button
                              type="submit"
                              variant="primary"
                              className="submit-btn button-ellipse text-uppercase my-4"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                />
                              ) : (
                                "Add New Dataset"
                              )}
                            </Button>
                          ) : null}
                        </Col>
                      </Row>
                    </Container>
                  </form>
                </>
              )}
            </Formik>
          </Card.Body>
        </Card>
        {props.datasets
          .slice(0)
          .reverse()
          .map((dataset) => (
            <Card key={dataset.id} className="my-4 pt-3">
              <Card.Body className="mt-4">
                <Formik
                  enableReinitialize={true}
                  initialValues={{
                    id: dataset.id,
                    source_url: dataset.source_url,
                    rid: dataset.rid,
                    access_type: dataset.access_type,
                    log_access_type: dataset.log_access_type,
                    longdesc: dataset.longdesc,
                  }}
                  onSubmit={props.handleDatasetUpdate}
                >
                  {({
                    values,
                    errors,
                    handleChange,
                    setFieldValue,
                    handleSubmit,
                    isSubmitting,
                    setValues,
                    dirty,
                  }) => (
                    <>
                      <form className="px-4" onSubmit={handleSubmit}>
                        <Container>
                          <Form.Group
                            as={Row}
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label className="text-base" column>
                              Name
                            </Form.Label>
                            <Col sm="6">
                              <Form.Control
                                disabled
                                plaintext
                                defaultValue={dataset.name}
                              />
                            </Col>
                            <Col sm="2">
                              <Button
                                variant="danger"
                                className="btn-block"
                                onClick={() => {
                                  props.handleDatasetDelete(values.id);
                                }}
                              >
                                <i className="fas fa-trash-alt"></i>
                              </Button>
                            </Col>
                          </Form.Group>
                          <Form.Group
                            as={Row}
                            controlId="source_url"
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label className="text-base" column>
                              Link to Paper
                            </Form.Label>
                            <Col sm="8">
                              <Form.Control
                                onChange={handleChange}
                                defaultValue={values.source_url}
                              />
                            </Col>
                          </Form.Group>
                          <Form.Group
                            as={Row}
                            controlId="access_type"
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label className="text-base" column>
                              Access Type
                            </Form.Label>
                            <Col sm="8">
                              <Form.Control
                                as="select"
                                onChange={handleChange}
                                value={values.access_type}
                              >
                                {props.availableAccessTypes.map(
                                  (type, index) => (
                                    <option key={index} value={type}>
                                      {type}
                                    </option>
                                  )
                                )}
                              </Form.Control>
                            </Col>
                          </Form.Group>
                          <Form.Group
                            as={Row}
                            controlId="log_access_type"
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label className="text-base" column>
                              Log Access Type
                            </Form.Label>
                            <Col sm="8">
                              <Form.Control
                                as="select"
                                onChange={handleChange}
                                value={values.log_access_type}
                              >
                                {props.availableLogAccessTypes.map(
                                  (type, index) => (
                                    <option key={index} value={type}>
                                      {type}
                                    </option>
                                  )
                                )}
                              </Form.Control>
                              <Form.Text id="paramsHelpBlock" muted>
                                <span style={{ color: "red" }}>Warning</span>:
                                Setting "Log Access Type" to "user" will give
                                users access to their model failure logs for
                                this dataset, for debugging purposes. Users
                                could use those failure logs to view the
                                contents of this dataset.
                              </Form.Text>
                            </Col>
                          </Form.Group>
                          <Form.Group
                            as={Row}
                            controlId="rid"
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label className="text-base" column>
                              Round
                            </Form.Label>
                            <Col sm="8">
                              <Form.Control
                                as="select"
                                value={values.rid}
                                onChange={handleChange}
                              >
                                {[
                                  "None",
                                  ...Array.from(
                                    { length: props.task.cur_round },
                                    (x, i) => i + 1
                                  ),
                                ].map((display, index) => (
                                  <option key={index} value={index}>
                                    {display}
                                  </option>
                                ))}
                              </Form.Control>
                            </Col>
                          </Form.Group>

                          <Form.Group
                            as={Row}
                            controlId="longdesc"
                            className="py-3 my-0"
                          >
                            <Form.Label className="text-base" column>
                              Description
                            </Form.Label>
                            <Form.Control
                              rows="6"
                              as="textarea"
                              defaultValue={values.longdesc}
                              onChange={handleChange}
                            />
                          </Form.Group>
                          <Form.Group as={Row} className="py-3 my-0">
                            <Col sm="8">
                              <small className="form-text text-muted">
                                {errors.accept}
                              </small>
                            </Col>
                          </Form.Group>
                          <Row className="justify-content-md-center">
                            <Col md={5} sm={12}>
                              {dirty ? (
                                <Button
                                  type="submit"
                                  variant="primary"
                                  className="submit-btn button-ellipse text-uppercase my-4"
                                  disabled={isSubmitting}
                                >
                                  Save
                                </Button>
                              ) : null}
                            </Col>
                          </Row>
                        </Container>
                      </form>
                    </>
                  )}
                </Formik>
              </Card.Body>
            </Card>
          ))}
      </Col>
    </Container>
  );
};

export default Datasets;
