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
import { Formik } from "formik";
import { Link } from "react-router-dom";

const Owners = (props) => {
  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">Owners</h1>
      <Col>
        <Card>
          <Card.Body className="mt-4">
            <Formik
              initialValues={{
                owners: props.owners,
                owner_to_toggle: null,
              }}
              onSubmit={props.handleOwnerUpdate}
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
                  <form className="px-4" onSubmit={handleSubmit}>
                    <Container>
                      <Form.Group as={Row} className="py-3 my-0 border-bottom">
                        <Form.Label className="text-base" column>
                          Owners
                        </Form.Label>
                        <Col sm="8" style={{ margin: 0, padding: 15 }}>
                          {values.owners.map((value, index) => (
                            <Link
                              key={index}
                              to={`/users/${value.id}`}
                              className="btn-link"
                            >
                              {value.username}{" "}
                            </Link>
                          ))}
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="owner_to_toggle"
                        className="py-3 my-0"
                      >
                        <Form.Label className="text-base" column>
                          Add/Remove Owner
                        </Form.Label>
                        <Col sm="8">
                          <Form.Control
                            defaultValue={values.owner_to_toggle}
                            onChange={handleChange}
                          />
                          <Form.Text muted>Enter username</Form.Text>
                        </Col>
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
      </Col>
    </Container>
  );
};

export default Owners;
