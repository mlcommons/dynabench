/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from "react";
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
import useFetch from "use-http";
import { getActiveDataperfTasks } from "../services/TaskService";

const DataperfTaskPage = () => {
  const { data: dataperfTasks = [] } = useFetch(
    "/task/get_active_dataperf_tasks",
    []
  );
  const [taskId, setTaskId] = useState(1);

  return (
    <OverlayProvider initiallyHide={true} delayMs="1700">
      {dataperfTasks && (
        <Container fluid>
          <Row>
            <Col lg={2} className="p-0 border">
              <Nav defaultActiveKey="/" className="flex-column">
                {dataperfTasks.map((task) => (
                  <Nav.Link>{task.name}</Nav.Link>
                ))}
              </Nav>
            </Col>
            <Col lg={10} className="px-4 px-lg-5">
              <TaskPage taskId={1} />
            </Col>
          </Row>
        </Container>
      )}
    </OverlayProvider>
  );
};

export default DataperfTaskPage;
