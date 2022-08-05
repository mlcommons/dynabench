/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Fragment, useState, useEffect, useContext } from "react";
import {
  Card,
  Pagination,
  Col,
  Spinner,
  Tooltip,
  Button,
  OverlayTrigger,
} from "react-bootstrap";
import { Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import UserContext from "../../containers/UserContext";
import { getOrderedWeights } from "../TaskLeaderboard/TaskModelLeaderboardCardWrapper";
import { SortContainer, SortDirection } from "../TaskLeaderboard/SortContainer";
import { FloresSnapshotModal } from "../TaskLeaderboard/ForkAndSnapshotModalWrapper";

/**
 * The Overall Flores Model Leaderboard component
 *
 * @param {Object} props React props de-structured.
 * @param {String} props.taskId the flores task id for the leader board.
 * @param {String} props.taskCode the flores task code for the leader board.
 * @param {string} props.history navigation API
 * @param {boolean} props.isTop5 Whether or not component is in "view top 5" mode
 * @param {boolean} props.disableToggleSort Whether or not changing sort field/direction is allowed
 * @param {boolean} props.disableSnapshot Whether or not snapshotting is allowed
 * @param {Object} props.snapshotData Static snapshot data if viewing a snapshot page
 *
 */
const FloresModelLeaderboard = (props) => {
  const context = useContext(UserContext);
  const [data, setData] = useState([]);
  const [task, setTask] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState({
    field: "sp-BLEU",
    direction: SortDirection.DESC,
  });
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);

  const { taskId, history, isTop5, taskCode, snapshotData } = props;

  useEffect(() => {
    setIsLoading(true);

    if (snapshotData) {
      setData(
        snapshotData.data.slice(page * pageLimit, (page + 1) * pageLimit)
      );
      setTotal(snapshotData.count);
      setSort(snapshotData.miscInfoJson.sort);
    } else {
      const dummyMetricWeights = [
        { weight: 1 },
        { weight: 0 },
        { weight: 0 },
        { weight: 0 },
        { weight: 0 },
      ];
      const dummyDatasetWeights = [{ weight: 1 }];
      const { orderedMetricWeights, orderedDatasetWeights } = getOrderedWeights(
        dummyMetricWeights,
        dummyDatasetWeights
      );
      context.api
        .getDynaboardScores(
          taskId,
          isTop5 ? 5 : pageLimit,
          page * pageLimit,
          sort.field,
          sort.direction,
          orderedMetricWeights, // [1, 0, 0, 0, 0]
          orderedDatasetWeights // [1]
        )
        .then(
          (result) => {
            setTotal(result.count);
            setData(result.data);
          },
          (error) => {
            console.log(error);
            if (error.status_code === 404 || error.status_code === 405) {
              history.push("/");
            }
          }
        );
    }

    setIsLoading(false);
    return () => {};
  }, [
    taskId,
    context.api,
    page,
    pageLimit,
    sort,
    history,
    isTop5,
    snapshotData,
  ]);

  useEffect(() => {
    setIsLoading(true);
    setPage(0);
    context.api.getTask(taskId).then(
      (result) => {
        setTask(result);
      },
      (error) => {
        console.log(error);
      }
    );
    setIsLoading(false);
    return () => {};
  }, [taskId, context.api]);

  /**
   * Update or toggle the sort field.
   *
   * @param {string} field
   */
  const toggleSort = (field) => {
    if (props.disableToggleSort) {
      return;
    }

    const currentDirection = sort.direction;

    const newDirection =
      field !== sort.field
        ? SortDirection.DESC
        : SortDirection.getOppositeDirection(currentDirection);

    setSort({
      field: field,
      direction: newDirection,
    });
  };

  const isEndOfPage = (page + 1) * pageLimit >= total;

  const leaderBoardData = data.map((i, index) => {
    const modelCell = isTop5 ? (
      <td>
        {i.model_name ? i.model_name : "Model " + i.model_id}{" "}
        {i.username ? "(" + i.username + ")" : null}
      </td>
    ) : (
      <td>
        {i.model_name ? (
          <Link to={`/models/${i.model_id}`} className="btn-link">
            {i.model_name}
          </Link>
        ) : (
          "Anonymous Model " + i.model_id
        )}{" "}
        {i.username ? (
          <Link to={`/users/${i.uid}#profile`} className="btn-link">
            ({i.username})
          </Link>
        ) : null}
      </td>
    );

    return (
      <Fragment key={i.model_id}>
        <tr>
          {modelCell}
          <td className="text-right">{i.averaged_scores[0].toFixed(2)}</td>
        </tr>
      </Fragment>
    );
  });

  if (isLoading) return <Spinner animation="border" />;

  const dummyMetricWeights = [
    { weight: 1 },
    { weight: 0 },
    { weight: 0 },
    { weight: 0 },
    { weight: 0 },
  ];
  const dummyDatasetWeights = [{ weight: 1 }];

  return (
    <Col className="ml-auto mr-auto" md={isTop5 ? "12" : "5"}>
      <Card className="my-4">
        <Card.Header className="light-gray-bg d-flex align-items-center">
          <h2 className="text-uppercase m-0 text-reset">
            Model Leaderboard - {task.name}
          </h2>
          <div className="d-flex justify-content-end flex-fill">
            <FloresSnapshotModal
              metricWeights={dummyMetricWeights}
              datasetWeights={dummyDatasetWeights}
              taskId={taskId}
              taskCode={taskCode}
              showModal={showSnapshotModal}
              setShowModal={setShowSnapshotModal}
              history={history}
              sort={sort}
              total={total}
            />
            {!props.disableSnapshot && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id="tip-leaderboard-fork">Snapshot</Tooltip>}
              >
                <Button
                  className="btn bg-transparent border-0"
                  onClick={() => {
                    if (context.api.loggedIn()) {
                      setShowSnapshotModal(true);
                    } else {
                      props.history.push(
                        "/login?msg=" +
                          encodeURIComponent(
                            "You need to login to create a leaderboard snapshot."
                          ) +
                          `&src=/flores/${task.task_code}`
                      );
                    }
                  }}
                >
                  <span className="text-black-50">
                    <i className="fas fa-camera"></i>
                  </span>
                </Button>
              </OverlayTrigger>
            )}
          </div>
        </Card.Header>
        <Card.Body className="p-0 leaderboard-container">
          <Table hover className="mb-0">
            <thead>
              <tr>
                <th>Model</th>
                <th className="text-right">
                  <SortContainer
                    sortKey={"sp-BLEU"}
                    toggleSort={toggleSort}
                    currentSort={sort}
                  >
                    Average BLEU
                  </SortContainer>
                </th>
              </tr>
            </thead>
            <tbody>{leaderBoardData}</tbody>
          </Table>
        </Card.Body>
        <Card.Footer>
          {isTop5 && (
            <img
              src="/Powered_by_Dynabench-Logo.svg"
              style={{ height: "24px" }}
              alt="dynabench logo"
            />
          )}
          {!isTop5 && (
            <Pagination className="mb-0 float-right" size="sm">
              <Pagination.Item
                disabled={isLoading || page === 0}
                onClick={() => {
                  setPage(page - 1);
                }}
              >
                Previous
              </Pagination.Item>
              <Pagination.Item
                disabled={isLoading || isEndOfPage}
                onClick={() => {
                  setPage(page + 1);
                }}
              >
                Next
              </Pagination.Item>
            </Pagination>
          )}
        </Card.Footer>
      </Card>
    </Col>
  );
};

export default FloresModelLeaderboard;
