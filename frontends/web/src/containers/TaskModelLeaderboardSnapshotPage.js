/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useContext, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import "./TaskPage.css";
import { Col, Container, Row, Spinner, Table } from "react-bootstrap";
import UserContext from "./UserContext";
import { TaskModelSnapshotLeaderboard } from "../components/TaskLeaderboard/TaskModelLeaderboardCardWrapper";
import Moment from "react-moment";
import FloresModelLeaderBoard from "../components/FloresComponents/FloresModelLeaderboard";

const TaskModelLeaderboardSnapshotPage = (props) => {
  const context = useContext(UserContext); // for API
  const [task, setTask] = useState(null); // Current task data
  const [snapshotWithCreator, setSnapshotWithCreator] = useState(null); // Current snapshot data
  const [isLoading, setIsLoading] = useState(false);
  const [isFlores, setIsFlores] = useState(false);

  const { taskCode, forkOrSnapshotName } = useParams();

  // Call api only once
  useEffect(() => {
    /**
     * Invoke APIService to fetch Task and Snapshot data
     *
     * @param {*} api instance of @see APIService
     */
    const fetchTaskAndSnapshot = (api) => {
      setIsLoading(true);
      api.getTask(taskCode).then(
        (taskData) => {
          setTask(taskData);
          const isFlores = taskData.task_code.indexOf("flores") > -1;
          setIsFlores(isFlores);
          if (taskCode !== taskData.task_code) {
            props.history.replace({
              pathname: props.location.pathname.replace(
                `${taskCode}/${forkOrSnapshotName}`,
                `${taskData.task_code}/${forkOrSnapshotName}`
              ),
              search: props.location.search,
            });
          }

          const newPathname = isFlores
            ? `/flores/${taskData.shortname}`
            : `/tasks/${taskCode}`;

          context.api
            .getLeaderboardSnapshot(taskData.id, forkOrSnapshotName)
            .then(
              (snapshotWithCreatorData) => {
                if (snapshotWithCreatorData?.snapshot.tid !== taskData.id) {
                  props.history.replace({
                    pathname: newPathname,
                  });
                } else {
                  setSnapshotWithCreator(snapshotWithCreatorData);
                }
                setIsLoading(false);
              },
              (error) => {
                console.log(error);
                if (error && error.status_code === 404) {
                  props.history.replace({
                    pathname: newPathname,
                  });
                }
                setSnapshotWithCreator(null);
                setIsLoading(false);
              }
            );
        },
        (error) => {
          console.log(error);
          setIsLoading(false);
        }
      );
    };

    fetchTaskAndSnapshot(context.api);

    return () => {};
  }, [
    taskCode,
    forkOrSnapshotName,
    context.api,
    props.history,
    props.location.pathname,
    props.location.search,
  ]);

  if (isLoading || !task || !snapshotWithCreator) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  const { snapshot, creator } = snapshotWithCreator;

  return (
    <Container fluid>
      <Row className="justify-content-center">
        <h2 className="task-page-header text-reset text-center ">
          {task.name} Snapshot
        </h2>
      </Row>
      <Row className="justify-content-center mt-4">
        <Col xs={12} md={5}>
          <Row className="justify-content-center">
            <Table className="w-50 font-weight-bold">
              <thead />
              <tbody>
                <tr>
                  <td>Owner:</td>
                  <td className="text-right">
                    <Link to={`/users/${creator.id}`}>{creator.username}</Link>
                  </td>
                </tr>
                <tr>
                  <td>Created:</td>
                  <td className="text-right">
                    <Moment utc fromNow>
                      {snapshot.create_datetime}
                    </Moment>
                  </td>
                </tr>
              </tbody>
            </Table>
          </Row>
        </Col>
      </Row>
      <Row className="text-center justify-content-center mt-4 px-4 px-lg-5">
        <Col xs={12} md={7}>
          <p>{snapshot.desc}</p>
        </Col>
      </Row>
      <Row className="px-4 px-lg-5">
        <Col xs={12}>
          {isFlores ? (
            <FloresModelLeaderBoard
              {...props}
              taskId={task.id}
              taskCode={taskCode}
              snapshotData={JSON.parse(snapshot.data_json)}
              disableSnapshot={true}
              disableToggleSort={true}
            />
          ) : (
            <TaskModelSnapshotLeaderboard
              {...props}
              task={task}
              taskCode={taskCode}
              snapshotData={JSON.parse(snapshot.data_json)}
              disableToggleSort={true}
              disableAdjustWeights={true}
              disableForkAndSnapshot={true}
            />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default TaskModelLeaderboardSnapshotPage;
