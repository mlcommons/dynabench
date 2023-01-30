/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Col, Container, Row, Spinner } from "react-bootstrap";
import useFetch from "use-http";
import Dataperf from "./CommunitiesLandingPages/Dataperf";
import { OverlayProvider } from "./Overlay";
import TaskCard from "../components/Cards/TaskCard";

const DataperfTaskPage = () => {
  const { data: tasksInfo = [] } = useFetch(
    "/task/get_active_tasks_with_round_info",
    []
  );

  return (
    <OverlayProvider initiallyHide={true} delayMs="1700">
      {tasksInfo ? (
        <Container fluid>
          <Row>
            <Col className="px-4 px-lg-5">
              <Dataperf />
            </Col>
          </Row>
          <Row className="py-4">
            <Col className="px-4 px-lg-5">
              <p className="heroe-description d-block text-center">
                Dataperf invites you to demonstrate the power of your algorithms
                on these data-centric benchmarks
              </p>
            </Col>
          </Row>
          <Container>
            <Row key="Dataperf" className="py-4">
              {tasksInfo
                .filter((t) => t.challenge_type === 2)
                .map((task) => (
                  <Col sm={6} lg={3} className="mb-3" key={task.id}>
                    <TaskCard
                      id={task.id}
                      name={task.name}
                      description={task.desc}
                      curRound={task.round.cur_round}
                      totalCollected={task.round.total_collected}
                      totalFooled={task.round.total_fooled}
                      lastUpdated={task.last_updated}
                      taskCode={task.task_code}
                    />
                  </Col>
                ))}
            </Row>
          </Container>
        </Container>
      ) : (
        <Spinner />
      )}
    </OverlayProvider>
  );
};

export default DataperfTaskPage;
