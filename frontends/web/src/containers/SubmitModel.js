/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect, useContext } from "react";
import { Button, Col, Container } from "react-bootstrap";
import UserContext from "../containers/UserContext";

const SubmitModel = () => {
  const context = useContext(UserContext);

  const [inputFile, setInputFile] = useState(null);

  useEffect(() => {
    setInputFile(document.getElementById("input-file"));
  }, []);

  const handleUploadModel = (e) => {
    inputFile?.click();
  };

  const handleSubmitModel = (e) => {
    e.preventDefault();
    const user = context.api.getCredentials();
    const files = inputFile.files[0];
    console.log(files);
    const fetchData = async () => {
      await context.api.uploadModelUser(user.id, files);
    };
    fetchData();
  };

  return (
    <Container className="mb-5 pb-5">
      <Col className="m-auto" lg={9}>
        <div className="mb-5 text-center">
          <h1 className="my-4 pt-3 text-uppercase">Upload your own model</h1>
          <h2 className="task-page-header d-block font-weight-normal m-0 text-reset">
            Dynabench is a platform for dynamic data collection and
            benchmarking. Static benchmarks have many issues. Dynabench offers a
            more accurate and sustainable way for evaluating progress in AI.
          </h2>
        </div>
        <div className="mt-5">
          <ul>
            <li>
              <strong>Download dynalab 2.0</strong>
              <p>
                You must clone the following repository for your specific task
              </p>
            </li>
            <li>
              <strong>Understand the folders</strong>
              <p>
                Inside the repository you will find a folder called app. Inside
                this folder you will find a folder called domain. Finally you
                will find a file called model.py, this is the only file that
                must be modified.
              </p>
            </li>
            <li>
              <strong>Understand the folders</strong>
              <p>
                Inside the repository you will find a folder called app. Inside
                this folder you will find a folder called domain. Finally you
                will find a file called model.py, this is the only file that
                must be modified.
              </p>
            </li>
            <li>
              <strong>Single evaluation function</strong>
              <p>
                In this file you will find a class called "ModelController" with
                only two methods. The class contains only one mandatory method
                called "single_evaluation". As its name indicates this method
                must receive a single input and return a prediction.
              </p>
            </li>
            <li>
              <strong>More classes, functions, ...</strong>
              <p>
                It is important to mention that you can create as many
                functions, classes, or variables as you consider necessary, just
                keeping in mind that the final result will be contained in the
                "single_evaluation" function of the "ModelController" class.
              </p>
            </li>
            <li>
              <strong>Where put your model</strong>
              <p>
                To store the different components of the model (weights,
                tokenizers, processors, etc) there is a folder called resources.
              </p>
            </li>

            <li>
              <strong>Test your model</strong>
              <p>Upload your zip here =)</p>
              <div className="m-3">
                <label className="mx-3">Choose file: </label>
                <input id="input-file" className="d-none" type="file" />
                <button
                  onClick={handleUploadModel}
                  className="btn btn-outline-primary"
                >
                  Upload
                </button>
                <button
                  onClick={handleSubmitModel}
                  className="btn btn-outline-primary"
                >
                  Submit
                </button>
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
  );
};

export default SubmitModel;
