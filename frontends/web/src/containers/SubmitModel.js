/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect, useContext } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import UserContext from "../containers/UserContext";
import "./SubmitModel.css";

const SubmitModel = (props) => {
  const context = useContext(UserContext);

  const [inputFile, setInputFile] = useState(null);
  const [loadingFile, setLoadingFile] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dynalab, setDynalab] = useState("");
  const [taskData, setTaskData] = useState({});

  useEffect(() => {
    setInputFile(document.getElementById("input-file"));
    const fetchTaskData = async () => {
      const taskData = await context.api.getTask(props.match.params.taskCode);
      setTaskData(taskData);
    };
    const fetchDynalabData = async () => {
      const dynalab = await context.api.getDynalabTask(
        props.match.params.taskCode
      );
      setDynalab(dynalab);
    };
    fetchDynalabData();
    fetchTaskData();
  }, []);

  const handleUploadModel = () => {
    inputFile?.click();
    setLoadingFile(false);
  };

  const handleSubmitModel = (e) => {
    e.preventDefault();
    if (inputFile.files.length !== 0) {
      const user = context.api.getCredentials();
      const file = inputFile.files[0];
      const sendModelData = async () => {
        setLoading(false);
        await context.api.uploadModelUser(
          file,
          user.username,
          file.name,
          file.type,
          user.id,
          props.match.params.taskCode
        );
        setLoading(true);
      };
      sendModelData();
    } else {
      alert("Please upload a model");
      setLoadingFile(true);
    }
  };
  return (
    <>
      {loading ? (
        <Container className="mb-5 pb-5">
          <Col className="m-auto" lg={9}>
            <div className="mb-5 text-center">
              <h1 className="my-4 pt-3 text-uppercase">
                Upload your own model
              </h1>
              <h2 className="task-page-header d-block font-weight-normal m-0 text-reset">
                Imagine you developed a fancy model, living in
                /path/to/fancy_project, and you want to share your amazing
                results on the Dynabench model leaderboard. Dynalab 2.0 makes it
                easy for you to do just that.
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
                  <strong>Single evaluation function</strong>
                  <p>
                    In this file you will find a class called "ModelController"
                    with only two methods: the class constructor, and a method
                    called "single_evaluation". This is the method you need to
                    update. As its name indicates this method must receive a
                    single example as an input and return a prediction.
                  </p>
                </li>
                <li>
                  <strong>More classes, functions, ...</strong>
                  <p>
                    It is important to mention that you can create as many
                    functions, classes, or variables as you consider necessary.
                    Keep in mind that the final result will be contained in the
                    "single_evaluation" function of the "ModelController" class.
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
                  <p>
                    To make sure everything is working as intended, you have to
                    run the following commands:
                    <ul>
                      <li>python3 -m venv env</li>
                      <li>source env/bin/activate</li>
                      <li>python3 -m pip install -r requirements.txt</li>
                      <li>python3 -m uvicorn app.app:app --reload</li>
                    </ul>
                    Once you run the last command, open localhost:8000/docs on
                    your favorite browser (i.e. Chrome, Firefox, Brave, etc.).
                    In there, a FastAPI interface should allow you to test the
                    POST request. Click on the single evaluation method, and
                    then on the 'Try it out' button. Finally, fill the request
                    body with your desired input, and click the execute button.
                    Getting a 200 code as a response means you're ready to go!
                  </p>
                </li>
                <li>
                  <strong>Upload your model</strong>
                  <p>
                    Once you're done testing, zip the whole repository. Finally,
                    upload the zip file using the 'Upload model' button down
                    below, and finally click on submit model. Congratulations,
                    you've submitted your model to Dynabench.
                  </p>
                </li>

                <div className="m-3">
                  <input id="input-file" className="d-none" type="file" />
                  {loadingFile ? (
                    <Row>
                      <Col className="text-center">
                        <center>
                          <Button variant="primary" onClick={handleUploadModel}>
                            <i className="fas fa-edit"></i> Upload model
                          </Button>
                        </center>
                      </Col>
                    </Row>
                  ) : (
                    <Row>
                      <Col className="text-center">
                        <center>
                          <Button variant="primary" onClick={handleSubmitModel}>
                            <i className="fas fa-edit"></i> Submit model
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
              <a href="mailto:dynabench@fb.com">
                <Button className="button-ellipse blue-bg home-readmore-btn border-0">
                  Reach out to us
                </Button>
              </a>
            </div>
          </Col>
        </Container>
      ) : (
        <div className="center-loading">
          <button className="btn btn-primary" type="button" disabled>
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            ></span>
            &nbsp;&nbsp; &nbsp;Uploading your awesome model, please don't close
            this window...
          </button>
        </div>
      )}
    </>
  );
};

export default SubmitModel;
