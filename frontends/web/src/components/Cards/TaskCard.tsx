import { Badge, Card, CardGroup, Col, Container, Table } from "react-bootstrap";
import React, { FC } from "react";
import Moment from "react-moment";
import "./TaskCard.css";

type TaskCardProps = {
  id: number;
  name: string;
  description: string;
  curRound: number;
  totalCollected: number;
  totalFooled: number;
  lastUpdated: string;
  taskCode: string;
};

const TaskCard: FC<TaskCardProps> = ({
  id,
  name,
  description,
  curRound,
  totalCollected,
  totalFooled,
  lastUpdated,
  taskCode,
}) => {
  return (
    <Card key={id} className={`task-card`}>
      <h2 className="task-header principal-color text-uppercase text-center">
        {name}
      </h2>
      <Card.Body>
        <Card.Text className="text-center">{description}</Card.Text>
        <Table>
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
