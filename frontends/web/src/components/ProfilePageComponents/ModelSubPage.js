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

import React, { useEffect, useState } from "react";
import {
  Badge as BBadge,
  Card,
  Col,
  Container,
  Pagination,
  Table,
} from "react-bootstrap";

const ModelSubPage = (props) => {
  const [userModels, setUserModels] = useState([]);
  const [page, setPage] = useState(0);
  const [isEndOfPage, setIsEndOfPage] = useState(true);

  const { api, userId, pageLimit, history, pageTitle, isSelfModelsTable } =
    props;

  useEffect(() => {
    api.getUserModels(userId, pageLimit, page).then(
      (result) => {
        const isEndOfPage = (page + 1) * pageLimit >= (result.count || 0);
        setIsEndOfPage(isEndOfPage);
        setUserModels(result.data || []);
      },
      (error) => {
        console.log(error);
      }
    );
  }, [userId, page, api, pageLimit]);

  const paginate = (state) => {
    const is_next = state === "next";
    const newPage = is_next ? page + 1 : page - 1;
    setPage(newPage);
  };

  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">{pageTitle}</h1>
      <Col className="m-auto" lg={8}>
        <Card className="profile-card">
          <Card.Body>
            <Table className="modelTable mb-0">
              <thead className="principal-color border-bottom">
                <tr>
                  <td>
                    <b>Name</b>
                  </td>
                  <td>
                    <b>Task</b>
                  </td>
                  {isSelfModelsTable && (
                    <td className="text-center" width="200px">
                      <b>Publication Status</b>
                    </td>
                  )}
                </tr>
              </thead>
              <tbody>
                {!userModels.length ? (
                  <tr>
                    <td colSpan="4">
                      <div className="text-center">No data found</div>
                    </td>
                  </tr>
                ) : null}
                {userModels.map((model) => {
                  return (
                    <tr
                      className="cursor-pointer"
                      key={model.id}
                      onClick={() => history.push(`/models/${model.id}`)}
                    >
                      <td className="principal-color">
                        {model.name || "Unknown"}
                      </td>
                      <td>{model.task.task_code}</td>
                      {isSelfModelsTable && (
                        <td className="text-center" width="200px">
                          {model.is_published === true ? (
                            <BBadge variant="success" className="modelStatus">
                              Published
                            </BBadge>
                          ) : (
                            <BBadge variant="danger" className="modelStatus">
                              Unpublished
                            </BBadge>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
          <Card.Footer className="text-center">
            <Pagination className="mb-0 float-right" size="sm">
              <Pagination.Item
                disabled={!page}
                onClick={() => paginate("prev")}
              >
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
    </Container>
  );
};

export default ModelSubPage;
