import React, { FC, useEffect, useState } from "react";
import { Card, Pagination, Table } from "react-bootstrap";
import useFetch from "use-http";

type UserLeaderBoardCSVProps = {
  taskId: number;
};

const UserLeaderBoardCSV: FC<UserLeaderBoardCSVProps> = ({ taskId }) => {
  const [data, setData] = useState([]);
  const { get, response } = useFetch();

  const downloadCSV = async () => {
    const csvData = await get(`/score/read_users_score_csv/${taskId}`);
    if (response.ok) {
      setData(JSON.parse(csvData));
    }
  };

  useEffect(() => {
    downloadCSV();
    console.log(data);
  }, []);

  return (
    <>
      {data.length > 0 && (
        <Card className="my-4">
          <Card.Header className="light-gray-bg d-flex align-items-center">
            <h2 className="m-0 text-uppercase text-reset">
              Example Leaderboard
            </h2>
          </Card.Header>
          <Table hover className="mb-0">
            <thead>
              <tr>
                {Object.keys(data[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.keys(row).map((key, index) => (
                    <td key={index}>{row[key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
          <Card.Footer className="text-center">
            <Pagination className="float-right mb-0" size="sm">
              <Pagination.Item>Previous</Pagination.Item>
              <Pagination.Item>Next</Pagination.Item>
            </Pagination>
          </Card.Footer>
        </Card>
      )}
    </>
  );
};

export default UserLeaderBoardCSV;
