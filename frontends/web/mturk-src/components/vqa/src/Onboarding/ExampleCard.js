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
import { Card, Row, Col } from "react-bootstrap";
import AtomicImage from "../../../../../src/containers/AtomicImage.js";

class ExampleCard extends React.Component {
  render() {
    return (
      <Card
        className="d-flex justify-content-center overflow-hidden"
        style={{ height: "auto" }}
      >
        <Card.Header className="mb-4">
          {this.props.example.isValid ? (
            <h5 className="text-uppercase dark-principal-color spaced-header">
              {this.props.example.isValid
                ? "Valid Question"
                : "Invalid Question"}
            </h5>
          ) : (
            <p>
              <b style={{ color: "red" }}>
                INVALID QUESTION{" "}
                {this.props.onboardingMode === "creation"
                  ? " - DON'T ASK THIS TYPE OF QUESTION"
                  : ""}
              </b>{" "}
            </p>
          )}
        </Card.Header>
        <AtomicImage
          src={this.props.example["imageUrl"]}
          maxHeight={400}
          maxWidth={600}
        />
        <Card.Body className="overflow-auto pt-2" style={{ height: "auto" }}>
          <Card
            className="hypothesis rounded border m-3 card"
            style={{ minHeight: 120 }}
          >
            <Card.Body className="p-3">
              <Row>
                <Col>
                  <h6 className="text-uppercase dark-principal-color spaced-header">
                    Question:
                  </h6>
                  <p>
                    <small>{this.props.example["question"]}</small>
                  </p>
                  <h6 className="text-uppercase dark-principal-color spaced-header">
                    Why is this{" "}
                    {this.props.example.isValid ? "a valid" : "an invalid"}{" "}
                    question?
                  </h6>
                  <p>
                    <small>{this.props.example["explanation"]}</small>
                  </p>
                  {this.props.example.isValid && (
                    <>
                      <h6 className="text-uppercase dark-principal-color spaced-header">
                        {this.props.onboardingMode === "creation" ? "AI " : ""}{" "}
                        Answer:
                      </h6>
                      <p>
                        <small>{this.props.example["modelAns"]}</small>
                      </p>
                    </>
                  )}
                  {this.props.example.isValid && (
                    <>
                      <h6 className="text-uppercase dark-principal-color spaced-header">
                        Determine if{" "}
                        {this.props.onboardingMode === "creation"
                          ? "AI"
                          : "the answer"}{" "}
                        is correct or not:
                      </h6>
                      <p>
                        <small>{this.props.example["userFeedback"][0]}</small>
                      </p>
                      {this.props.example["userFeedback"][0] === "Incorrect" &&
                        this.props.onboardingMode === "creation" && (
                          <>
                            <h6 className="text-uppercase dark-principal-color spaced-header">
                              Provide the correct answer:
                            </h6>
                            <p>
                              <small>
                                {this.props.example["userFeedback"][1]}
                              </small>
                            </p>
                          </>
                        )}
                    </>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Card.Body>
      </Card>
    );
  }
}

export default ExampleCard;
