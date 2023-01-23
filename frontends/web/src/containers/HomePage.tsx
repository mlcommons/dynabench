import React from "react";
import TaskCard from "../components/Cards/TaskCard";
import { Col, Row } from "react-bootstrap";
import useFetch from "use-http";

const HomePage = () => {
  const { data: tasksInfo = [] } = useFetch(
    "/task/get_active_tasks_with_round_info",
    []
  );

  return (
    <>
      <h2>Task</h2>
      <Row xs={1} md={2} className="g-4">
        <Col className="mb-3">
          <TaskCard
            id={1}
            name="Task Title"
            description="Task Description"
            curRound={1}
            totalCollected={100}
            totalFooled={10}
            lastUpdated={"2023-01-12T10:53:53"}
            taskCode={"NLI"}
          />
        </Col>
      </Row>
    </>
  );
};

export default HomePage;
