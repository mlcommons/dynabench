import React, { FC } from "react";
import { Card, Pagination, Table } from "react-bootstrap";

type UserLeaderBoardProps = {
  data: any[];
};

const UserLeaderBoard: FC<UserLeaderBoardProps> = () => {
  return (
    <Card className="my-4">
      <Card.Header className="light-gray-bg d-flex align-items-center">
        <h2 className="m-0 text-uppercase text-reset">Example Leaderboard</h2>
      </Card.Header>
      <Table hover className="mb-0">
        <thead>
          <tr>
            <th>User</th>
          </tr>
        </thead>
        <tbody></tbody>
      </Table>
      <Card.Footer className="text-center">
        <Pagination className="float-right mb-0" size="sm">
          <Pagination.Item>Previous</Pagination.Item>
          <Pagination.Item>Next</Pagination.Item>
        </Pagination>
      </Card.Footer>
    </Card>
  );
};

export default UserLeaderBoard;
