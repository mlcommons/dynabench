/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from "react";
import { Col, Container, Nav, Row, Spinner } from "react-bootstrap";
import useFetch from "use-http";
import TaskPage from "../containers/TaskPage/TaskPage";
import Dataperf from "./CommunitiesLandingPages/Dataperf";
import { OverlayProvider } from "./Overlay";

const DataperfTaskPage = () => {
  const { data: dataperfTasks = [] } = useFetch(
    "/task/get_active_dataperf_tasks",
    []
  );
  const [taskId, setTaskId] = useState();

  useEffect(() => {}, [taskId]);

  return (
    <OverlayProvider initiallyHide={true} delayMs="1700">
      {dataperfTasks ? (
        <Container fluid>
          <Row>
            <Col lg={2} className="p-0 border">
              <Nav defaultActiveKey="/" className="flex-sm-row">
                <Nav.Link
                  onClick={() => setTaskId(null)}
                  className="active gray-color p-3 px-lg-5 flores-nav-item nav-link active"
                >
                  Dataperf
                </Nav.Link>
                {dataperfTasks.map((task) => (
                  <Nav.Link
                    className="active gray-color p-3 px-lg-5 flores-nav-item nav-link active"
                    onClick={(e) => {
                      setTaskId(task.id);
                    }}
                  >
                    {task.name.replace("Dataperf", "")}
                  </Nav.Link>
                ))}
              </Nav>
            </Col>
            <Col lg={10} className="px-4 px-lg-5">
              {taskId ? <TaskPage taskId={taskId} /> : <Dataperf />}
            </Col>
          </Row>
        </Container>
      ) : (
        <Spinner />
      )}
    </OverlayProvider>
  );
};

export default DataperfTaskPage;
