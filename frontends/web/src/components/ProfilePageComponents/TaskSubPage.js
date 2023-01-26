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

import React, { useEffect, useState, useCallback } from "react";
import { Card, Col, Container, Pagination, Table } from "react-bootstrap";
import TaskProposalSubPage from "./TaskProposalSubPage.js";

const TaskTable = (props) => {
  const { data, page, paginate, isEndOfPage, history } = props;

  const [showViewModals, setShowViewModals] = useState(
    data.map((datum) => false)
  );

  if (data.length !== showViewModals.length) {
    setShowViewModals(data.map((datum) => false));
  }

  return (
    <Col className="m-auto" lg={8}>
      <Card className="profile-card">
        <Card.Body>
          <Table className="taskTable mb-0">
            <thead className="principal-color border-bottom">
              <tr>
                <td>
                  <b>Name</b>
                </td>
                <td>
                  <b>Description</b>
                </td>
              </tr>
            </thead>
            <tbody>
              {!data.length ? (
                <tr>
                  <td colSpan="4">
                    <div className="text-center">No data found</div>
                  </td>
                </tr>
              ) : null}
              {data.map((task) => {
                return (
                  <tr
                    className="cursor-pointer"
                    key={task.id}
                    onClick={() => history.push(`/tasks/${task.id}`)}
                  >
                    <td className="principal-color">{task.name}</td>
                    <td>{task.desc || "No description provided"}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
        <Card.Footer className="text-center">
          <Pagination className="mb-0 float-right" size="sm">
            <Pagination.Item disabled={!page} onClick={() => paginate("prev")}>
              Previous
            </Pagination.Item>
            <Pagination.Item
              disabled={isEndOfPage}
              onClick={() => paginate("next")}
            >
              Next
            </Pagination.Item>
          </Pagination>
        </Card.Footer>
      </Card>
    </Col>
  );
};

const TaskSubPage = (props) => {
  const [userTasks, setUserTasks] = useState([]);
  const [page, setPage] = useState(0);
  const [isEndOfPage, setIsEndOfPage] = useState(true);
  const { api, userId, history } = props;
  const pageLimit = 5;

  const getPage = useCallback(() => {
    api.getUserTasks(userId, pageLimit, page).then(
      (result) => {
        const isEndOfPage = (page + 1) * pageLimit >= (result.count || 0);
        setIsEndOfPage(isEndOfPage);
        setUserTasks(result.data || []);
      },
      (error) => {
        console.log(error);
      }
    );
  }, [userId, page, api, pageLimit]);

  useEffect(() => {
    getPage();
  }, [getPage]);

  const paginate = (state) => {
    const is_next = state === "next";
    const newPage = is_next ? page + 1 : page - 1;
    setPage(newPage);
  };

  return (
    <>
      <Container className="mb-5 pb-5">
        <h1 className="my-4 pt-3 text-uppercase text-center">Your Tasks</h1>
        <TaskTable
          history={history}
          api={api}
          data={userTasks}
          page={page}
          getPage={getPage}
          paginate={paginate}
          isEndOfPage={isEndOfPage}
        />
      </Container>
      <>
        <TaskProposalSubPage
          handleProposalSubmit={props.handleProposalSubmit}
          api={api}
          history={history}
        />
      </>
    </>
  );
};

export default TaskSubPage;
