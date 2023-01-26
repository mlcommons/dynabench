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

import React, { useContext } from "react";
import { Col, Container, Nav, Row } from "react-bootstrap";
import { Annotation, OverlayProvider } from "./Overlay";
import "./TaskPage.css";
import TaskPage from "./TaskPage";
import UserContext from "./UserContext";

const FLORES_TASK_NAMES = ["Speech Dataperf", "Debugging Dataperf"];

const TaskNav = () => {
  return (
    <Nav className="sidebar-wrapper sticky-top">
      {FLORES_TASK_NAMES.map((name, index) => {
        return (
          <Nav.Item key={index}>
            <Nav.Link className="gray-color p-3 px-lg-5 flores-nav-item">
              {name}
            </Nav.Link>
          </Nav.Item>
        );
      })}
    </Nav>
  );
};

const FloresTaskPage = (props) => {
  console.log(props);
  return (
    <OverlayProvider initiallyHide={true} delayMs="1700">
      <Container fluid>
        <Row>
          <Col lg={2} className="p-0 border">
            <Annotation
              placement="bottom-start"
              tooltip="The Flores task has multiple tracks. You can look at other tracks here"
            >
              <TaskNav />
            </Annotation>
          </Col>
          <Col lg={10} className="p-0">
            <TaskPage {...props} />
          </Col>
        </Row>
      </Container>
    </OverlayProvider>
  );
};

export default FloresTaskPage;
