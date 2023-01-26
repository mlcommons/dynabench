/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import TaskCard from "../components/Cards/TaskCard";
import { Col, Row, Container } from "react-bootstrap";
import useFetch from "use-http";
import { OverlayProvider } from "./Overlay";
import "./HomePage.css";
import { Link } from "react-router-dom";

const HomePage = () => {
  const { data: tasksInfo = [] } = useFetch(
    "/task/get_active_tasks_with_round_info",
    []
  );

  return (
    <>
      <OverlayProvider initiallyHide={true}>
        <Container>
          <h2 className="heroe-title d-block text-center">TASKS</h2>
          <div>
            <span className="tag-community-button">
              <Link className="tag-community-text" to="/dataperf">
                Dataperf
              </Link>
            </span>
            <Row key="Dataperf">
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
          </div>
          <div>
            <span className="tag-community-button">
              <Link className="tag-community-text" to="/about">
                DADC
              </Link>
            </span>
            <Row key="DADC">
              {tasksInfo
                .filter((t) => t.challenge_type === 1)
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
          </div>
          <div>
            <span className="tag-community-button">
              <Link className="tag-community-text" to="/about">
                Others
              </Link>
            </span>
            <Row key="others">
              {tasksInfo
                .filter((t) => t.challenge_type === 4)
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
          </div>
        </Container>
      </OverlayProvider>
    </>
  );
};

export default HomePage;
