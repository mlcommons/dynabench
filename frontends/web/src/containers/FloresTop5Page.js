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

import React, { useContext, useState, useEffect } from "react";
import "./TaskPage.css";
import { Container, Row, Spinner } from "react-bootstrap";
import UserContext from "./UserContext";
import FloresModelLeaderBoard from "../components/FloresComponents/FloresModelLeaderboard";
import { FLORES_TASK_CODES } from "./FloresTaskPage";

const FloresTop5Page = (props) => {
  const context = useContext(UserContext); // for API
  const [task, setTask] = useState(null); // Current Task ID
  const [isLoading, setIsLoading] = useState(false);

  const taskCode = props.match.params.taskShortName
    .toLowerCase()
    .replace("-", "_");

  // Call api only once
  useEffect(() => {
    /**
     * Invoke APIService to fetch Flores Tasks
     *
     * @param {*} api instance of @see APIService
     */
    const fetchFloresTasks = (api) => {
      setIsLoading(true);
      api.getSubmittableTasks().then(
        (result) => {
          const floresTasks = result.filter((t) =>
            FLORES_TASK_CODES.includes(t.task_code)
          );
          const taskLookup = floresTasks.reduce(
            // eslint-disable-next-line
            (map, obj) => ((map[obj.task_code] = obj), map),
            {}
          );

          if (FLORES_TASK_CODES.includes(taskCode)) {
            setTask(taskLookup[taskCode]); // set the task from Arguments
          } else {
            setTask(taskLookup[FLORES_TASK_CODES[0]]); // set default task
          }

          setIsLoading(false);
        },
        (error) => {
          console.log(error);
          setIsLoading(false);
        }
      );
    };

    fetchFloresTasks(context.api);

    return () => {};
  }, [context.api, taskCode]);

  if (isLoading || !task) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Container fluid>
      <Row className="px-4 px-lg-5">
        <a
          href={`/flores/${task.name}`}
          target="_blank"
          style={{ width: "100%", textDecorationLine: "none" }}
          rel="noreferrer"
        >
          <FloresModelLeaderBoard
            {...props}
            taskId={task.id}
            taskCode={task.task_code}
            isTop5={true}
            disableSnapshot={true}
          />
        </a>
      </Row>
    </Container>
  );
};

export default FloresTop5Page;
