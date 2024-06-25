/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect, useContext } from "react";
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
import Swal from "sweetalert2";
import useFetch from "use-http";

const FileUpload = ({ values, filename, setFieldValue, disabled }) => {
  return values[filename] ? (
    <div className="UploadResult">
      <Card>
        <Card.Body>
          <Container>
            <Row>
              <Col md={10}>{values[filename].name}</Col>
              <Col md={2}>
                <Button
                  disabled={disabled}
                  variant="outline-danger"
                  size="sm"
                  onClick={() => {
                    setFieldValue(filename, null);
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
      disabled={disabled}
      handleChange={(event) => {
        setFieldValue(filename, event.currentTarget.files[0]);
      }}
    >
      Drag
    </DragAndDrop>
  );
};

const SubmitInterface = (props) => {
  const { get, response } = useFetch();
  const context = useContext(UserContext);
  const [sendCallSubmited, setSendCallSubmited] = useState(false);
  const [sendCallDatasets, setSendCallDatasets] = useState(false);
  const [state, setState] = useState({
    submission_type: props.submission_type,
    taskId: null,
    task: {},
    datasets: [],
    showModals: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      const { params } = props.match;
      if (!context.api.loggedIn()) {
        props.history.push(
          "/login?&src=" +
            encodeURIComponent(
              `/tasks/${params.taskId}/submit_${state.submission_type}`,
            ),
        );
      }

      setState((prevState) => ({ ...prevState, taskId: params.taskId }));
      !setSendCallDatasets && params.taskId && handleGetTask(params.taskId);
    };

    fetchData();
  }, [
    context.api,
    props.history,
    props.match,
    state.submission_type,
    state.taskId,
  ]);

  const handleGetTask = async (taskId) => {
    setSendCallDatasets(true);
    try {
      const taskResult = await context.api.getTask(taskId);
      setState((prevState) => ({ ...prevState, task: taskResult }));
      const datasets = await context.api.getDatasets(taskResult.id);
      setState((prevState) => ({
        ...prevState,
        datasets: datasets,
        showModals: datasets.map(() => false),
      }));
    } catch (error) {
      setSendCallDatasets(false);
      console.warn(error);
    }
  };

  const allowSubmitDynalab = async (task_id, user_id) => {
    console.log("task_id", task_id);
    if (!task_id) {
      return false;
    }
    const answer = await get(
      `/task/allow_update_dynalab_submissions/${task_id}/${user_id}`,
    );
    if (answer) {
      return true;
    }
    return false;
  };

  const handleIsAllowedToSubmit = async () => {
    setSendCallSubmited(true);
    const user = context.api.getCredentials();

    const allowUpload = await allowSubmitDynalab(state.task.id, user.id);
    if (!allowUpload) {
      Swal.fire({
        title: "Error!",
        text: "You have reached the maximum number of submissions for this task.",
        icon: "error",
        showConfirmButton: false,
        timer: 5000,
      }).then(() => {
        window.history.back();
      });
      return;
    }
  };

  useEffect(() => {
    !sendCallSubmited && state?.task?.id && handleIsAllowedToSubmit();
  }, [state.task]);

  const handleSubmit = async (
    values,
    { setFieldValue, setSubmitting, resetForm, setFieldError },
  ) => {
    const files = {};
    for (const dataset of state.datasets) {
      files[dataset.name] = values[dataset.name];
    }

    if (state.submission_type === "predictions") {
      try {
        const result = await context.api.uploadPredictions(
          state.task.id,
          values.modelName,
          files,
        );
        values.modelName = "";
        for (const [fname, _] of Object.entries(files)) {
          values[fname] = null;
        }
        values.submittedModelId = result.model_id;
        resetForm({ values: values });
        setSubmitting(false);
      } catch (error) {
        console.log(error);
        setFieldError(
          "accept",
          "Predictions could not be added (" + error.error + ")",
        );
        setSubmitting(false);
      }
    } else {
      if (!context.api.loggedIn()) {
        props.history.push(
          "/login?&src=" +
            encodeURIComponent(
              `/tasks/${props.match.params.taskId}/submit_${state.submission_type}`,
            ),
        );
      } else {
        context.api.uploadTrainFiles(state.task.id, values.modelName, files);
        values.modelName = "";
        for (const [fname, _] of Object.entries(files)) {
          values[fname] = null;
        }
        resetForm({ values: values });
        setSubmitting(false);
        setFieldError(
          "accept",
          "Thank you. You will soon receive an email about the status of your submission.",
        );
      }
    }
  };

  const files = {};
  for (const dataset of state.datasets) {
    files[dataset.name] = null;
  }

  return (
    <Container className="pb-5 mb-5">
      <h1 className="pt-3 my-4 text-center text-uppercase">
        {state.submission_type === "predictions"
          ? "Submit Model Predictions"
          : "Submit Files"}
      </h1>
      <Col>
        <Card className="my-4">
          <Card.Body>
            <Formik
              initialValues={{
                modelName: "",
                ...files,
              }}
              onSubmit={handleSubmit}
            >
              {({
                dirty,
                values,
                errors,
                handleChange,
                setFieldValue,
                handleSubmit,
                isSubmitting,
              }) => (
                <>
                  <form className="px-4" onSubmit={handleSubmit}>
                    <Container>
                      <Form.Group as={Row} className="py-3 my-0">
                        {state.submission_type === "predictions" ? (
                          <p>
                            Upload predicted answers as a <em>.jsonl</em> file,
                            where each line has a field for each of the model
                            output fields. Additionally, there should be a field
                            called "uid" that matches the "uid" field of the
                            example that the prediction is for.
                            <br />
                            <br />
                            We require that you upload a prediction file for
                            each of the leaderboard datasets. You can optionally
                            upload a prediction file for the other datasets.
                            <br />
                            <br />
                            <Markdown>
                              {state.task.predictions_upload_instructions_md}
                            </Markdown>
                          </p>
                        ) : (
                          <p>
                            We require that you upload a train file for each of
                            the leaderboard datasets. You can optionally upload
                            a train file for the other datasets.
                            <br />
                            <br />
                            <Markdown>
                              {state.task.train_file_upload_instructions_md}
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
                      {state.datasets.map((dataset, index) => (
                        <div key={index}>
                          <Modal
                            show={state.showModals[index]}
                            onHide={() =>
                              setState((prevState) => ({
                                ...prevState,
                                showModals: state.showModals.map(
                                  (obj, obj_index) =>
                                    index === obj_index ? !obj : obj,
                                ),
                              }))
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
                          <Form.Group as={Row} className="py-3 my-0 border-top">
                            <Form.Label className="text-base" column>
                              Dataset
                            </Form.Label>
                            <Col sm={8}>
                              <span
                                className="btn-link dataset-link"
                                onClick={() =>
                                  setState((prevState) => ({
                                    ...prevState,
                                    showModals: state.showModals.map(
                                      (obj, obj_index) =>
                                        index === obj_index ? !obj : obj,
                                    ),
                                  }))
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
                              . Scores may not be ready immediately, so check on
                              your submission later.
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
                              className="my-4 submit-btn button-ellipse text-uppercase"
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
};

export default SubmitInterface;
