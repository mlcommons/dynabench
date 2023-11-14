import React, { FC, useEffect, useState } from "react";
import {
  Card,
  Dropdown,
  DropdownButton,
  Pagination,
  Table,
} from "react-bootstrap";
import useFetch from "use-http";
import { PacmanLoader } from "react-spinners";

type UserLeaderBoardCSVProps = {
  taskId: number;
  rounds?: number[];
  title?: string;
};

const UserLeaderBoardCSV: FC<UserLeaderBoardCSVProps> = ({
  taskId,
  title,
  rounds,
}) => {
  const [data, setData] = useState([]);
  const [round, setRound] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const { post, response } = useFetch();

  const downloadCSV = async ({
    round,
  }: {
    round?: number;
  } = {}) => {
    setIsLoading(true);
    const csvData = await post("/score/read_users_score_csv/", {
      task_id: taskId,
      round_id: round,
    });
    if (response.ok) {
      setData(JSON.parse(csvData));
      setIsLoading(false);
    }
  };

  useEffect(() => {
    downloadCSV();
  }, []);

  return (
    <>
      {!isLoading ? (
        <>
          {data.length > 0 && (
            <Card className="my-4">
              <Card.Header className="gap-2 light-gray-bg d-flex align-items-center">
                <h2 className="m-0 text-uppercase text-reset">
                  {title ? title : "Example Leaderboard"}
                </h2>
                <DropdownButton
                  variant="light"
                  className="border-0 font-weight-bold light-gray-bg"
                  style={{ marginRight: 10 }}
                  id="dropdown-basic-button"
                  title={round ? `Round ${round}` : "All"}
                >
                  <Dropdown.Item
                    key={round}
                    onClick={() => {
                      setRound(undefined);
                      downloadCSV();
                    }}
                  >
                    All
                  </Dropdown.Item>
                  {rounds &&
                    rounds.map((round) => (
                      <Dropdown.Item
                        key={round}
                        onClick={() => {
                          setRound(round);
                          downloadCSV({ round });
                        }}
                      >
                        Round {round}
                      </Dropdown.Item>
                    ))}
                </DropdownButton>
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
      ) : (
        <div className="flex items-center justify-center h-32">
          <PacmanLoader color="#ccebd4" loading={isLoading} size={50} />
        </div>
      )}
    </>
  );
};

export default UserLeaderBoardCSV;
