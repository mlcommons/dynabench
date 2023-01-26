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

import React, { useCallback, useEffect, useState } from "react";
import { Card, Col, Container, Pagination, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import Moment from "react-moment";
import ChevronExpandButton from "../Buttons/ChevronExpandButton";
import { FLORES_TASK_CODES } from "../../containers/FloresTaskPage";

const ForkOrSnapshotTable = (props) => {
  const { data, isForkList, page, paginate, isEndOfPage } = props;
  const [descriptionConfiguration, setDescriptionConfiguration] = useState({});

  const usesEllipsis = (elementId) => {
    const e = document.getElementById(elementId);
    return e == null ? false : e.offsetWidth < e.scrollWidth;
  };

  const getRowKey = useCallback(
    (datum) => {
      return isForkList ? datum.tid + "-" + datum.name : datum.id;
    },
    [isForkList]
  );

  const getDescriptionId = useCallback(
    (datum) => {
      return getRowKey(datum) + "-desc";
    },
    [getRowKey]
  );

  useEffect(() => {
    const newDescriptionConfiguration = {};
    data.forEach((datum) => {
      const descriptionId = getDescriptionId(datum);
      newDescriptionConfiguration[descriptionId] = {
        usesEllipsis: usesEllipsis(descriptionId),
        isExpanded: false,
      };
    });
    setDescriptionConfiguration(newDescriptionConfiguration);
  }, [data, getDescriptionId]);

  const toggleDescriptionEllipsis = (descriptionId) => {
    const dupDescriptionConfiguration = {
      ...descriptionConfiguration,
    };
    dupDescriptionConfiguration[descriptionId].isExpanded =
      !dupDescriptionConfiguration[descriptionId].isExpanded;
    setDescriptionConfiguration(dupDescriptionConfiguration);
  };

  return (
    <Col className="m-auto" lg={12}>
      <Card className="profile-card">
        <Card.Body className="overflow-auto">
          <Table className="mb-0">
            <thead className="principal-color border-bottom">
              <tr>
                <td>
                  <b>Link to {isForkList ? "Fork" : "Snapshot"}</b>
                </td>
                <td>
                  <b>Task</b>
                </td>
                <td>
                  <b>Description</b>
                </td>
                <td />
                <td>
                  <b>Created</b>
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
              {data.map((datum) => {
                const rowKey = getRowKey(datum);
                const descriptionId = getDescriptionId(datum);
                const usesEllipsis =
                  descriptionConfiguration[descriptionId]?.usesEllipsis;
                const isDescriptionExpanded =
                  descriptionConfiguration[descriptionId]?.isExpanded;

                const forkOrSnapshotUrl = `https://ldbd.ly/${datum.task.task_code}/${datum.name}`;
                const taskPageUrl = FLORES_TASK_CODES.includes(
                  datum.task.task_code
                )
                  ? `/flores/${datum.task.task_code}`
                  : `/tasks/${datum.task.task_code}`;

                return (
                  <tr key={rowKey}>
                    <td className="text-truncate long-text">
                      <span>
                        <a href={forkOrSnapshotUrl}>{forkOrSnapshotUrl}</a>
                      </span>
                    </td>
                    <td>
                      <Link to={taskPageUrl}>{datum.task.task_code}</Link>
                    </td>
                    <td
                      id={descriptionId}
                      className={`long-text ${
                        isDescriptionExpanded ? "" : "text-truncate"
                      }`}
                      onClick={() => toggleDescriptionEllipsis(descriptionId)}
                    >
                      <span style={{ maxWidth: "280px" }}>{datum.desc}</span>
                    </td>
                    <td
                      className="px-0"
                      onClick={() => toggleDescriptionEllipsis(descriptionId)}
                    >
                      {usesEllipsis && (
                        <ChevronExpandButton
                          expanded={isDescriptionExpanded}
                          containerClassName={"d-inline-block"}
                        />
                      )}
                    </td>
                    <td className="text-nowrap">
                      Created{" "}
                      <Moment utc fromNow>
                        {datum.create_datetime}
                      </Moment>
                    </td>
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

const ForksAndSnapshotsSubPage = (props) => {
  const [userForks, setUserForks] = useState([]);
  const [userSnapshots, setUserSnapshots] = useState([]);
  const [forksPage, setForksPage] = useState(0);
  const [snapshotsPage, setSnapshotsPage] = useState(0);
  const [isEndOfForksPage, setIsEndOfForksPage] = useState(true);
  const [isEndOfSnapshotsPage, setIsEndOfSnapshotsPage] = useState(true);

  const { api, userId } = props;
  const pageLimit = 5;

  useEffect(() => {
    api.getUserForks(userId, pageLimit, forksPage).then(
      (result) => {
        const isEndOfPage = (forksPage + 1) * pageLimit >= (result.count || 0);
        setIsEndOfForksPage(isEndOfPage);
        setUserForks(result.data || []);
      },
      (error) => {
        console.log(error);
      }
    );
  }, [userId, forksPage, api]);

  useEffect(() => {
    api.getUserSnapshots(userId, pageLimit, snapshotsPage).then(
      (result) => {
        const isEndOfPage =
          (snapshotsPage + 1) * pageLimit >= (result.count || 0);
        setIsEndOfSnapshotsPage(isEndOfPage);
        setUserSnapshots(result.data || []);
      },
      (error) => {
        console.log(error);
      }
    );
  }, [userId, snapshotsPage, api]);

  const paginateForks = (state) => {
    const is_next = state === "next";
    const newPage = is_next ? forksPage + 1 : forksPage - 1;
    setForksPage(newPage);
  };

  const paginateSnapshots = (state) => {
    const is_next = state === "next";
    const newPage = is_next ? snapshotsPage + 1 : snapshotsPage - 1;
    setSnapshotsPage(newPage);
  };

  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">Your Forks</h1>
      <ForkOrSnapshotTable
        data={userForks}
        isForkList={true}
        page={forksPage}
        paginate={paginateForks}
        isEndOfPage={isEndOfForksPage}
      />
      <h1 className="my-4 pt-3 text-uppercase text-center">Your Snapshots</h1>
      <ForkOrSnapshotTable
        data={userSnapshots}
        isForkList={false}
        page={snapshotsPage}
        paginate={paginateSnapshots}
        isEndOfPage={isEndOfSnapshotsPage}
      />
    </Container>
  );
};

export default ForksAndSnapshotsSubPage;
