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
import { Container, Row, Form, Col, Card, Button } from "react-bootstrap";
import Markdown from "react-markdown";
import { Formik } from "formik";
import { Link } from "react-router-dom";
import { useState } from "react";
import ChevronExpandButton from "../Buttons/ChevronExpandButton";
import Contexts from "./Contexts";
import { Spinner } from "react-bootstrap";
const yaml = require("js-yaml");

const Rounds = (props) => {
  const [showModelSelectRound, setShowModelSelectRound] = useState(
    props.rounds.map((round) => false)
  );
  const [showContextUploadRound, setShowContextUploadRound] = useState(
    props.rounds.map((round) => false)
  );

  if (props.rounds.length !== showModelSelectRound.length) {
    setShowModelSelectRound(props.rounds.map((round) => false));
  }

  if (props.rounds.length !== showContextUploadRound.length) {
    setShowContextUploadRound(props.rounds.map((round) => false));
  }

  const toggleIsTarget = (model_identifiers, index, setFieldValue) => {
    model_identifiers[index].is_in_the_loop =
      !model_identifiers[index].is_in_the_loop;
    console.log(model_identifiers[index]);
    setFieldValue("model_identifiers", model_identifiers);
  };

  const context = yaml.load(props.task.config_yaml).context;
  const allowContextUpload = context ? context.length !== 0 : false;

  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">Rounds</h1>
      <Col>
        <Card className="my-4">
          <Card.Body>
            <Row className="justify-content-md-center">
              <Col md={5} sm={12}>
                <Button
                  type="submit"
                  variant="primary"
                  className="submit-btn button-ellipse text-uppercase my-4"
                  onClick={props.createRound}
                >
                  Create New Round
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        {props.rounds
          .slice(0)
          .reverse()
          .map((round) => (
            <Card key={round.rid} className="my-4 pt-3">
              <Card.Body className="mt-4">
                <Row>
                  <Col>
                    <Button
                      variant="primary"
                      className="float-right"
                      disabled={props.dataExporting[round.rid]}
                      onClick={() => props.exportData(round.rid)}
                    >
                      {props.dataExporting[round.rid] ? (
                        <Spinner animation="border" />
                      ) : (
                        <i className="fa fa-download" aria-hidden="true"></i>
                      )}
                    </Button>
                  </Col>
                </Row>
                <Formik
                  enableReinitialize={true}
                  initialValues={{
                    contexts_file: null,
                    rid: round.rid,
                    longdesc: round.longdesc,
                    model_identifiers: props.get_models_in_the_loop[round.rid],
                  }}
                  onSubmit={props.handleRoundUpdate}
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
                            <Form.Label column>Round</Form.Label>
                            <Col sm="8">
                              <Form.Control
                                plaintext
                                disabled
                                value={round.rid}
                              />
                            </Col>
                          </Form.Group>
                          <Form.Group
                            as={Row}
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label column>
                              Total Fooling Examples
                            </Form.Label>
                            <Col sm="8">
                              <Form.Control
                                plaintext
                                disabled
                                value={round.total_fooled}
                              />
                            </Col>
                          </Form.Group>
                          <Form.Group
                            as={Row}
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label column>
                              Total Verified Fooling Examples
                            </Form.Label>
                            <Col sm="8">
                              <Form.Control
                                plaintext
                                disabled
                                value={round.total_verified_fooled}
                              />
                            </Col>
                          </Form.Group>
                          <Form.Group
                            as={Row}
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label column>
                              Total Collected Examples
                            </Form.Label>
                            <Col sm="8">
                              <Form.Control
                                plaintext
                                disabled
                                value={round.total_collected}
                              />
                            </Col>
                          </Form.Group>
                          <Form.Group
                            as={Row}
                            className="py-3 my-0"
                            onClick={() =>
                              setShowModelSelectRound(
                                showModelSelectRound.map((obj, rid) =>
                                  rid === round.rid - 1
                                    ? !showModelSelectRound[round.rid - 1]
                                    : obj
                                )
                              )
                            }
                          >
                            <Form.Label column>
                              Set Models in the Loop
                            </Form.Label>
                            <Col sm="8">
                              <ChevronExpandButton
                                expanded={showModelSelectRound[round.rid - 1]}
                                containerClassName={
                                  "py-2 position-absolute start-100"
                                }
                              />
                            </Col>
                          </Form.Group>
                          {showModelSelectRound[round.rid - 1] ? (
                            <Container>
                              <Form.Group controlId="is_in_the_loop">
                                {values.model_identifiers.map(
                                  (model_identifier, index) => (
                                    <Row key={model_identifier.model_id}>
                                      <Col>
                                        <Link
                                          to={`/models/${model_identifier.model_id}`}
                                          className="btn-link"
                                        >
                                          {model_identifier.model_name}
                                        </Link>{" "}
                                        <Link
                                          to={`/users/${model_identifier.uid}#profile`}
                                          className="btn-link"
                                        >
                                          ({model_identifier.username})
                                        </Link>
                                      </Col>
                                      <Col>
                                        <Form.Check
                                          name="is_in_the_loop"
                                          checked={
                                            model_identifier.is_in_the_loop
                                          }
                                          onClick={() =>
                                            toggleIsTarget(
                                              values.model_identifiers,
                                              index,
                                              setFieldValue
                                            )
                                          }
                                          onChange={handleChange}
                                        />
                                      </Col>
                                    </Row>
                                  )
                                )}
                              </Form.Group>
                            </Container>
                          ) : null}
                          {allowContextUpload && (
                            <Form.Group
                              as={Row}
                              className="py-3 my-0 border-top"
                              onClick={() =>
                                setShowContextUploadRound(
                                  showContextUploadRound.map((obj, rid) =>
                                    rid === round.rid - 1
                                      ? !showContextUploadRound[round.rid - 1]
                                      : obj
                                  )
                                )
                              }
                            >
                              <Form.Label column>Upload Contexts</Form.Label>
                              <Col sm="8">
                                <ChevronExpandButton
                                  expanded={
                                    showContextUploadRound[round.rid - 1]
                                  }
                                  containerClassName={
                                    "py-2 position-absolute start-100"
                                  }
                                />
                              </Col>
                            </Form.Group>
                          )}
                          {showContextUploadRound[round.rid - 1] ? (
                            <Contexts
                              values={values}
                              setFieldValue={setFieldValue}
                              errors={errors}
                              setValues={setValues}
                            />
                          ) : null}
                          <Form.Group
                            as={Row}
                            controlId="longdesc"
                            className="py-3 my-0 border-top"
                          >
                            <Form.Label column>Round Description</Form.Label>
                            <Form.Control
                              rows="6"
                              as="textarea"
                              defaultValue={values.longdesc}
                              onChange={handleChange}
                            />
                            <Form.Text id="paramsHelpBlock" muted>
                              <Markdown>
                                The text will be rendered as
                                [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML)
                                in the task page.
                              </Markdown>
                            </Form.Text>
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

export default Rounds;
