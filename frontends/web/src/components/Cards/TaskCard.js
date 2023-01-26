/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Card, Table } from "react-bootstrap";
import Moment from "react-moment";
import { useHistory } from "react-router-dom";
import "./TaskCard.css";

const TaskCard = ({
  id,
  name,
  description,
  curRound,
  totalCollected,
  totalFooled,
  lastUpdated,
  taskCode,
}) => {
  const history = useHistory();
  return (
    <Card
      key={id}
      className={`task-card`}
      onClick={() => history.push(`/tasks/${taskCode}`)}
    >
      <h2 className="task-header principal-color text-uppercase text-center">
        {name}
      </h2>
      <Card.Body>
        <Card.Text className="text-center">{description}</Card.Text>
        <Table size="sm">
          <thead></thead>
          <tbody>
            <tr>
              <td>Round:</td>
              <td>{curRound}</td>
            </tr>
            <tr>
              <td>Model error rate:</td>
              <td>
                {totalCollected > 0
                  ? ((100 * totalFooled) / totalCollected).toFixed(2)
                  : "0.00"}
                % ({totalFooled}/{totalCollected})
              </td>
            </tr>
            <tr>
              <td>Last activity:</td>
              <td>
                <Moment utc fromNow>
                  {lastUpdated}
                </Moment>
              </td>
            </tr>
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default TaskCard;
