import React, { FC, useEffect, useState } from "react";
import { Dropdown, DropdownButton } from "react-bootstrap";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";
import { PacmanLoader } from "react-spinners";
import useFetch from "use-http";
import filterFactory, { textFilter } from "react-bootstrap-table2-filter";

type LeaderBoardHeaderValuesProps = {
  title: string;
  value: string;
};

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
  const [leaderBoardHeaderValues, setLeaderBoardHeaderValues] = useState<
    LeaderBoardHeaderValuesProps[]
  >([]);
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

  const getLeaderBoardHeaderValues = async () => {
    setIsLoading(true);
    const leaderBoardHeaderValues = await post(
      "/score/read_leaderboard_metadata/",
      {
        task_id: taskId,
        round_id: round,
      },
    );
    if (response.ok) {
      setLeaderBoardHeaderValues(leaderBoardHeaderValues);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      await downloadCSV();
      await getLeaderBoardHeaderValues();
    }
    fetchData();
  }, []);

  function priceFormatter(column: { text: string }) {
    return (
      <div className="flex flex-row capitalize cursor-pointer">
        <span className="text-[0.85rem] text-letter-color">{column.text}</span>
        <svg
          className="w-3 h-3 mt-1 ml-1 "
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 19 20"
        >
          <path d="M15 20V5h3l-5.1-5L8 5h3v15zM2 0v15h-3l4.9 5L9 15H6V0z" />
        </svg>
      </div>
    );
  }

  const pageButtonRenderer = ({ page, onPageChange }: any) => {
    const handleClick = (e: any) => {
      e.preventDefault();
      onPageChange(page);
    };

    return (
      <li className="mb-2 page-item ">
        <a
          href="/"
          className="page-link"
          onClick={handleClick}
          style={{ color: "#4a5568" }}
        >
          {page}
        </a>
      </li>
    );
  };

  const columns =
    data.length > 0
      ? Object.keys(data[0]).map((key) => ({
          dataField: key,
          text: key,
          sort: true,
          filter: textFilter(),
          headerFormatter: priceFormatter,
        }))
      : [];

  return (
    <>
      {!isLoading ? (
        <>
          {leaderBoardHeaderValues.length > 0 && (
            <div className="flex flex-col gap-2 pb-2">
              {leaderBoardHeaderValues.map((headerValue, key) => (
                <div className="flex flex-row justify-between" key={key}>
                  <h2 className="m-0 text-base text-reset">
                    {headerValue.title}:
                  </h2>
                  <span className="text-base font-semibold text-letter-color">
                    {headerValue.value}
                  </span>
                </div>
              ))}
            </div>
          )}
          {data.length > 0 && (
            <div className="overflow-x-auto border border-gray-200 rounded-lg bg-gray-100/40">
              <div className="">
                <div className="flex flex-row items-center justify-between px-4 py-2">
                  <div className="flex flex-col">
                    <h2 className="m-0 text-base text-uppercase text-reset">
                      {title ? title : "Example Leaderboard"}
                    </h2>
                  </div>
                  <DropdownButton
                    variant="light"
                    className="font-bold border-0 font-weight-bold text-letter-color"
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
                </div>
              </div>
              <div className="bg-white">
                <BootstrapTable
                  keyField="id"
                  data={data}
                  columns={columns}
                  sort={{ dataField: "score", order: "desc" }}
                  filter={filterFactory()}
                  pagination={paginationFactory({
                    sizePerPage: 15,
                    showTotal: true,
                    pageButtonRenderer,
                    hideSizePerPage: true,
                    hidePageListOnlyOnePage: true,
                    paginationTotalRenderer(from, to, size) {
                      return (
                        <div className="flex flex-row items-center justify-between">
                          <span className="pt-2 ml-3 ">
                            Showing {from} to {to} of {size}
                          </span>
                        </div>
                      );
                    },
                  })}
                />
              </div>
            </div>
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
