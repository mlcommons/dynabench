/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect, useContext } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import UserContext from "../containers/UserContext";

const SubmitModel = (props) => {
  const context = useContext(UserContext);

  const [inputFile, setInputFile] = useState(null);
  const [loadingFile, setLoadingFile] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setInputFile(document.getElementById("input-file"));
  }, []);

  const handleUploadModel = (e) => {
    inputFile?.click();
    const fetchData = async () => {
      await context.api.getTask(props.match.params.taskCode);
    };
    fetchData();
    const task = fetchData();
    setLoadingFile(false);
    console.log(task);
  };

  const handleSubmitModel = (e) => {
    e.preventDefault();

    if (inputFile.files.length !== 0) {
      setLoading(false);
      const user = context.api.getCredentials();
      const file = inputFile.files[0];
      const fetchData = async () => {
        await context.api.uploadModelUser(
          file,
          user.username,
          file.name,
          file.type,
          user.id,
          props.match.params.taskCode
        );
      };
      const result = fetchData();
      setLoading(true);
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
                results on the Dynabench model leaderboard. Dynalab makes it
                easy for you to do just that
              </h2>
            </div>
            <div className="mt-5">
              <ul>
                <li>
                  <strong>Download dynalab 2.0</strong>
                  <p>
                    Please download{" "}
                    <a
                      download
                      href="https://models-dynalab.s3.eu-west-3.amazonaws.com/MT/dynalab-base-mt.zip"
                    >
                      {" "}
                      this
                    </a>{" "}
                    project, and unzip in your own computer
                  </p>
                </li>
                <li>
                  <strong>Understand the folders</strong>
                  <p>
                    Inside the repository you will find a folder called app.
                    Inside this folder you will find a folder called domain.
                    Finally you will find a file called model.py, this is the
                    only file that must be modified.
                  </p>
                </li>
                <li>
                  <strong>Single evaluation function</strong>
                  <p>
                    In this file you will find a class called "ModelController"
                    with only two methods. The class contains only one mandatory
                    method called "single_evaluation". As its name indicates
                    this method must receive a single input and return a
                    prediction.
                  </p>
                </li>
                <li>
                  <strong>More classes, functions, ...</strong>
                  <p>
                    It is important to mention that you can create as many
                    functions, classes, or variables as you consider necessary,
                    just keeping in mind that the final result will be contained
                    in the "single_evaluation" function of the "ModelController"
                    class.
                  </p>
                </li>
                <li>
                  <strong>Where put your model and dependencies</strong>
                  <p>
                    To store the different components of the model (weights,
                    tokenizers, processors, etc) there is a folder called
                    resources. Remember to put all the libraries necessary for
                    your model in requirements.txt
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
                      <li>test the single_evaluation method</li>
                    </ul>
                  </p>
                  <div className="m-3">
                    <input id="input-file" className="d-none" type="file" />
                    {loadingFile ? (
                      <Row>
                        <Col className="text-center">
                          <center>
                            <Button
                              variant="primary"
                              onClick={handleUploadModel}
                            >
                              <i className="fas fa-edit"></i> Upload model
                            </Button>
                          </center>
                        </Col>
                      </Row>
                    ) : (
                      <Row>
                        <Col className="text-center">
                          <center>
                            <Button
                              variant="primary"
                              onClick={handleSubmitModel}
                            >
                              <i className="fas fa-edit"></i> Submit model
                            </Button>
                          </center>
                        </Col>
                      </Row>
                    )}
                  </div>
                </li>
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
        <div className="spinner-grow text-info" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      )}
    </>
  );
};

export default SubmitModel;
