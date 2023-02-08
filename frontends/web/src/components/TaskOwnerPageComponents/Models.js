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
import { Container, Row, Form, Col, Card, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import { DeploymentStatus } from "../../containers/ModelStatus";
import "../../containers/ModelStatus.css";

const Models = (props) => {
  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">Models</h1>
      <Col>
        <Card>
          <Card.Body className="mt-4">
            <form className="px-4">
              <Container>
                <Form.Group as={Row} className="py-3 my-0 border-bottom">
                  <Form.Label className="text-base" column>
                    <b>Model</b>
                  </Form.Label>
                  <Form.Label className="text-base" column>
                    <b>Publication Status</b>
                  </Form.Label>
                  <Form.Label className="text-base" column>
                    <b>Deployment Status</b>
                  </Form.Label>
                </Form.Group>
                {props.model_identifiers.map((model_identifier, index) => (
                  <Form.Group
                    key={index}
                    as={Row}
                    className="py-3 my-0 border-bottom"
                  >
                    <Form.Label className="text-base" column>
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
                    </Form.Label>
                    <Form.Label className="text-base" column>
                      {model_identifier.is_published ? (
                        <Badge variant="success" className="modelStatus">
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="modelStatus">
                          Unpublished
                        </Badge>
                      )}
                    </Form.Label>
                    <Form.Label className="text-base" column>
                      <DeploymentStatus
                        deploymentStatus={model_identifier.deployment_status}
                      />
                    </Form.Label>
                  </Form.Group>
                ))}
              </Container>
            </form>
          </Card.Body>
        </Card>
      </Col>
    </Container>
  );
};

export default Models;
