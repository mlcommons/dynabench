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
  Button,
  Form,
  Modal,
  Spinner,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { Formik } from "formik";
import UserContext from "./UserContext";
import Markdown from "react-markdown";
import DragAndDrop from "../components/DragAndDrop/DragAndDrop";

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
                  disabled={props.disabled}
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
      disabled={props.disabled}
      handleChange={(event) => {
        props.setFieldValue(props.filename, event.currentTarget.files[0]);
      }}
    >
      Drag
    </DragAndDrop>
  );
};

class SubmitInterface extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      submission_type: this.props.submission_type,
      taskId: null,
      task: {},
      datasets: [],
      showModals: [],
    };
  }
  componentDidMount() {
    const {
      match: { params },
    } = this.props;
    if (!this.context.api.loggedIn()) {
      this.props.history.push(
        "/login?&src=" +
          encodeURIComponent(
            "/tasks/" +
              this.props.match.params.taskId +
              "/submit_" +
              this.state.submission_type
          )
      );
    }

    this.setState({ taskId: params.taskId }, function () {
      this.context.api.getTask(this.state.taskId).then(
        (result) => {
          this.setState({ task: result }, function () {
            this.context.api.getDatasets(result.id).then((datasets) => {
              this.setState({
                datasets: datasets,
                showModals: datasets.map((dataset) => false),
              });
            });
          });
        },
        (error) => {
          console.log(error);
        }
      );
    });
  }

  handleSubmit = (
    values,
    { setFieldValue, setSubmitting, resetForm, setFieldError }
  ) => {
    const files = {};
    for (const dataset of this.state.datasets) {
      files[dataset.name] = values[dataset.name];
    }

    if (this.state.submission_type === "predictions") {
      this.context.api
        .uploadPredictions(this.state.task.id, values.modelName, files)
        .then(
          (result) => {
            values.modelName = "";
            for (const [fname, _] of Object.entries(files)) {
              values[fname] = null;
            }
            values.submittedModelId = result.model_id;
            resetForm({ values: values });
            setSubmitting(false);
          },
          (error) => {
            console.log(error);
            setFieldError(
              "accept",
              "Predictions could not be added (" + error.error + ")"
            );
            setSubmitting(false);
          }
        );
    } else {
      this.context.api.uploadTrainFiles(
        this.state.task.id,
        values.modelName,
        files
      );
      values.modelName = "";
      for (const [fname, _] of Object.entries(files)) {
        values[fname] = null;
      }
      resetForm({ values: values });
      setSubmitting(false);
      setFieldError(
        "accept",
        "Thank you. You will soon recieve an email about the status of your submission."
      );
    }
  };

  render() {
    const files = {};
    for (const dataset of this.state.datasets) {
      files[dataset.name] = null;
    }
    return (
      <Container className="mb-5 pb-5">
        <h1 className="my-4 pt-3 text-uppercase text-center">
          {this.state.submission_type === "predictions"
            ? "Submit Model Predictions"
            : "Submit Files"}
        </h1>
        <Col>
          <Card className="my-4">
            <Card.Body>
              <Formik
                initialValues={Object.assign(
                  {
                    modelName: "",
                  },
                  files
                )}
                onSubmit={this.handleSubmit}
              >
                {({
                  dirty,
                  values,
                  errors,
                  handleChange,
                  setFieldValue,
                  handleSubmit,
                  isSubmitting,
                  setValues,
                }) => (
                  <>
                    <form className="px-4" onSubmit={handleSubmit}>
                      <Container>
                        <Form.Group as={Row} className="py-3 my-0">
                          {this.state.submission_type === "predictions" ? (
                            <p>
                              Upload predicted answers as a <em>.jsonl</em>{" "}
                              file, where each line has a field for each of the
                              model output fields. Additionally, there should be
                              a field called "uid" that matches the "uid" field
                              of the example that the prediction is for.
                              <br />
                              <br />
                              We require that you upload a prediction file for
                              each of the leaderboard datasets. You can
                              optionally upload a prediction file for the other
                              datasets.
                              <br />
                              <br />
                              <Markdown>
                                {
                                  this.state.task
                                    .predictions_upload_instructions_md
                                }
                              </Markdown>
                            </p>
                          ) : (
                            <p>
                              We require that you upload a train file for each
                              of the leaderboard datasets. You can optionally
                              upload a train file for the other datasets.
                              <br />
                              <br />
                              <Markdown>
                                {
                                  this.state.task
                                    .train_file_upload_instructions_md
                                }
                              </Markdown>
                            </p>
                          )}
                        </Form.Group>
                        <Form.Group
                          as={Row}
                          controlId="modelName"
                          className="py-3 my-0 border-top"
                        >
                          <Form.Label className="text-base" column>
                            Model Name
                          </Form.Label>
                          <Col sm={8}>
                            <Form.Control
                              disabled={isSubmitting}
                              value={values.modelName}
                              onChange={handleChange}
                            />
                          </Col>
                        </Form.Group>
                        {this.state.datasets.map((dataset, index) => (
                          <div key={index}>
                            <Modal
                              show={this.state.showModals[index]}
                              onHide={() =>
                                this.setState({
                                  showModals: this.state.showModals.map(
                                    (obj, obj_index) =>
                                      index === obj_index ? !obj : obj
                                  ),
                                })
                              }
                            >
                              <Modal.Header closeButton>
                                <Modal.Title>{dataset.name}</Modal.Title>
                              </Modal.Header>
                              <Modal.Body>
                                {dataset.longdesc}
                                <br />
                                <br />
                                {dataset.source_url &&
                                dataset.source_url !== "" ? (
                                  <Button href={dataset.source_url}>
                                    <i className="fas fa-newspaper"></i> Read
                                    Paper
                                  </Button>
                                ) : (
                                  ""
                                )}
                              </Modal.Body>
                            </Modal>
                            <Form.Group
                              as={Row}
                              className="py-3 my-0 border-top"
                            >
                              <Form.Label className="text-base" column>
                                Dataset
                              </Form.Label>
                              <Col sm={8}>
                                <span
                                  className="btn-link dataset-link"
                                  onClick={() =>
                                    this.setState({
                                      showModals: this.state.showModals.map(
                                        (obj, obj_index) =>
                                          index === obj_index ? !obj : obj
                                      ),
                                    })
                                  }
                                >
                                  {dataset.name}
                                </span>
                              </Col>
                            </Form.Group>
                            <Form.Group as={Row} className="py-3 my-0">
                              <Form.Label className="text-base" column>
                                Files
                              </Form.Label>
                              <Col sm={8}>
                                <FileUpload
                                  disabled={isSubmitting}
                                  values={values}
                                  filename={dataset.name}
                                  setFieldValue={setFieldValue}
                                />
                              </Col>
                            </Form.Group>
                          </div>
                        ))}
                        <Form.Group as={Row} className="py-3 my-0">
                          <Col sm="8">
                            <small className="form-text text-muted">
                              {errors.accept}
                            </small>
                          </Col>
                          <Col sm="8">
                            <small className="form-text text-muted">
                              {values.accept}
                            </small>
                          </Col>
                          {values.submittedModelId && (
                            <Col sm="8">
                              <small className="form-text text-muted">
                                Thanks for your submission. You can view it{" "}
                                <Link to={"/models/" + values.submittedModelId}>
                                  here
                                </Link>
                                . Scores may not be ready immediately, so check
                                on your submission later.
                              </small>
                            </Col>
                          )}
                        </Form.Group>
                        <Row className="justify-content-md-center">
                          <Col md={5} sm={12}>
                            {dirty && values.modelName !== "" ? (
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
                                  "Upload"
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
        </Col>
      </Container>
    );
  }
}

export default SubmitInterface;
