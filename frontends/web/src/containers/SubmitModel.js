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

import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";
import CreateModel from "../components/Forms/CreateModel";
import UserContext from "../containers/UserContext";
import "./SubmitModel.css";

const useUploadFile = () => {
  const context = useContext(UserContext);

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (progress === 0.5) {
      const interval = setInterval(() => {
        const tick = 0.05;
        console.log(progress);
        setProgress((p) => p + tick);
        console.log(progress);
        if (progress >= 1) {
          clearInterval(interval);
        }
      }, 60000);
    }
  }, [progress]);

  const send = (formData, url) => {
    const token = context.api.getToken();
    return axios
      .request({
        method: "post",
        url: `${context.api.domain}${url}`,
        data: formData,
        headers: {
          Authorization: token ? "Bearer " + token : "None",
        },
        onUploadProgress: (p) => {
          setProgress(p.loaded / p.total / 2);
        },
      })
      .then((data) => {
        setProgress(1);
        return true;
      });
  };

  return { progress, send };
};

const ProgressBar = ({ progress, text }) => {
  return (
    <div
      className="center-loading"
      style={{
        width: "50%",
      }}
    >
      <div className="progress">
        <div
          className="progress-bar progress-bar-striped progress-bar-animated"
          role="progressbar"
          style={{ width: `${progress * 100}%` }}
        ></div>
      </div>
      <h6>
        {progress > 0 && progress < 0.5
          ? text
          : progress >= 0.5
          ? "We are processing your model"
          : ""}
      </h6>
    </div>
  );
};

const SubmitModel = (props) => {
  const context = useContext(UserContext);

  const [loadingFile, setLoadingFile] = useState(true);
  const [loading, setLoading] = useState({
    loading: true,
    text: "",
  });
  const [dynalab, setDynalab] = useState("");
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const { progress, send } = useUploadFile();

  useEffect(() => {
    const fetchTaskData = async () => {
      setLoading({ loading: false, text: "Loading" });
      const taskData = await context.api.getTask(props.match.params.taskCode);
      const taskCode = taskData.task_code.replace(/^\s+|\s+$/gm, "");
      if (!context.api.loggedIn()) {
        props.history.push(
          "/login?msg=" +
            encodeURIComponent(
              "Please sign up or log in so that you can upload a model"
            ) +
            "&src=" +
            encodeURIComponent(`/tasks/${taskCode}/uploadModel`)
        );
      } else {
        const dynalab = await context.api.getDynalabTask(taskCode);
        setDynalab(dynalab);
        setLoading({ loading: true, text: "Loading" });
      }
    };
    fetchTaskData();
  }, []);

  useEffect(() => {
    console.log(progress);
  }, [progress]);

  const handleSubmitModel = (modelData) => {
    console.log(modelData);

    if (modelData.file.length !== 0) {
      const user = context.api.getCredentials();
      const file = modelData.file[0];
      setLoading({
        loading: false,
        text: "Your model is being uploaded.",
      });
      const formData = new FormData();
      formData.append("model_name", modelData.modelName);
      formData.append("description", modelData.desc);
      formData.append("num_paramaters", modelData.numParams);
      formData.append("languages", modelData.languages);
      formData.append("license", modelData.license);
      formData.append("file", file);
      formData.append("file_name", file.name);
      formData.append("file_type", file.type);
      formData.append("user_name", user.username);
      formData.append("user_id", user.id);
      formData.append("task_code", props.match.params.taskCode);
      send(formData, "/users/model/upload").then((data) => {
        setLoading({ loading: true, text: "Done" });
        alert("Your model has been successfully uploaded");
      });
    } else {
      setLoadingFile(true);
      alert("Please upload a model");
      setLoading({ loading: true, text: "Done" });
    }
  };

  return (
    <>
      {loading.loading ? (
        <Container className="mb-5 pb-5">
          <Col className="m-auto" lg={9}>
            <div className="mb-5 text-center">
              <h1 className="my-4 pt-3 text-uppercase">
                Upload your own model
              </h1>
              <h2 className="task-page-header d-block font-weight-normal m-0 text-reset">
                The instructions for model uploads are as follows:
              </h2>
            </div>
            <div className="mt-5">
              <ul>
                <li>
                  <strong>Download Dynalab 2.0</strong>
                  <p>
                    Please download{" "}
                    <a download href={dynalab}>
                      {" "}
                      this
                    </a>{" "}
                    project, and unzip in your own computer.
                  </p>
                </li>
                <li>
                  <strong>Understand the folders</strong>
                  <p>
                    Inside the repository you will find a folder called app.
                    This folder contains three folders: api, domain, and
                    resources. The api stores some logic you don't need to
                    touch. Resources is empty, and that's the place where you'll
                    want to stote your model's components (i.e. weights,
                    tokenizers, processors, etc.). Finally, the domain folder is
                    where you'll be including your models logic. Specifically,
                    look for the model.py file.
                  </p>
                </li>
                <li>
                  <strong>Single and batch evaluation functions</strong>
                  <p>
                    In model script you will find a class called
                    *ModelController* where you can delete everything except by
                    3 methods *constructor*, *single_evaluation* and
                    *batch_evaluation*. These 2 methods are the ones you have to
                    update in order to make inferences using your model.
                  </p>
                </li>
                <li>
                  <strong>More classes, functions, ...</strong>
                  <p>
                    It is important to mention that you can create as many
                    functions, classes, or variables as you consider necessary.
                    Keep in mind that the final result will be contained in the
                    "single_evaluation" and "batch_evaluation" functions of the
                    "ModelController" class.
                  </p>
                </li>
                <li>
                  <strong>Include the dependencies</strong>
                  <p>
                    Don't forget to include the dependencies required to run
                    your model on the requirements.txt file, without removing
                    any of the libraries already included there.
                  </p>
                </li>
                <li>
                  <strong>Test your model</strong>
                  <br />
                  <span>
                    To make sure everything is working as intended, you have to
                    run the following commands:
                    <ul>
                      <li>python3 -m venv env</li>
                      <li>source env/bin/activate</li>
                      <li>python3 -m pip install -r requirements.txt</li>
                      <li>python3 -m uvicorn app.app:app --reload</li>
                    </ul>
                    <br />
                    Once you run the last command, open localhost:8000/docs on
                    your favorite browser (i.e. Chrome, Firefox, Brave, etc.).
                    In there, a FastAPI interface should allow you to test the
                    POST request. Click on the single evaluation method, and
                    then on the 'Try it out' button. Finally, fill the request
                    body with your desired input, and click the execute button.
                    Getting a 200 code as a response means you're ready to go!
                  </span>
                </li>
                <br />
                <li>
                  <strong>Upload your model</strong>
                  <br />
                  <span>
                    Once you're done testing, zip the whole repository. Finally,
                    upload the zip file using the 'Upload model' button down
                    below, and finally click on submit model. Congratulations,
                    you've submitted your model to Dynabench.
                  </span>
                </li>

                <div className="m-3">
                  <input id="input-file" className="d-none" type="file" />
                  {loadingFile ? (
                    <Row>
                      <Col className="text-center">
                        <center>
                          <Button
                            onClick={() => handleShow(true)}
                            className="center-submit-model"
                          >
                            <i className="fas fa-edit "></i> Upload model
                          </Button>
                          <Modal show={show} onHide={handleClose}>
                            <CreateModel
                              handleClose={handleClose}
                              handleSubmitModel={handleSubmitModel}
                            />
                          </Modal>
                        </center>
                      </Col>
                    </Row>
                  ) : (
                    <Row>
                      <Col className="text-center">
                        <center>
                          <Button
                            className="center-submit-model"
                            onClick={handleSubmitModel}
                          >
                            <i className="fas fa-edit center-submit-model"></i>{" "}
                            Submit model
                          </Button>
                        </center>
                      </Col>
                    </Row>
                  )}
                </div>
              </ul>
            </div>
            <div className="text-center">
              <h2 className="home-cardgroup-header d-block font-weight-light mb-4 text-uppercase text-reset">
                Have a question?
              </h2>
              <a href="mailto:dynabench-site@mlcommons.org">
                <Button variant="primary">
                  <i className="fas fa-edit"></i> Reach out to us
                </Button>
              </a>
            </div>
          </Col>
        </Container>
      ) : (
        <ProgressBar progress={progress} text={loading.text} />
      )}
    </>
  );
};

export default SubmitModel;
