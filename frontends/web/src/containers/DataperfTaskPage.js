/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {
  Container,
  Row,
  Col,
  ButtonGroup,
  Nav,
  Spinner,
} from "react-bootstrap";
import { OverlayProvider, Annotation, OverlayContext } from "./Overlay";
import TaskPage from "../containers/TaskPage/TaskPage";

const DataperfTaskPage = () => {
  return (
    <OverlayProvider initiallyHide={true} delayMs="1700">
      <Container fluid>
        <Row>
          <Col lg={2} className="p-0 border">
            <Nav defaultActiveKey="/home" className="flex-column">
              <Nav.Link href="/home">Active</Nav.Link>
              <Nav.Link eventKey="link-1">Link</Nav.Link>
              <Nav.Link eventKey="link-2">Link</Nav.Link>
              <Nav.Link eventKey="disabled" disabled>
                Disabled
              </Nav.Link>
            </Nav>
          </Col>
          <Col lg={10} className="px-4 px-lg-5">
            <TaskPage props />
          </Col>
        </Row>
      </Container>
    </OverlayProvider>
  );
};

export default DataperfTaskPage;
