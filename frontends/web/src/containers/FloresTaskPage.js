/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useContext, useState, useEffect } from "react";
import "./TaskPage.css";
import { useParams } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  ButtonGroup,
  Nav,
  Spinner,
} from "react-bootstrap";
import UserContext from "./UserContext";
import { OverlayProvider, Annotation, OverlayContext } from "./Overlay";
import FloresActionButtons from "../components/Buttons/FloresActionButtons";
import FloresModelLeaderBoard from "../components/FloresComponents/FloresModelLeaderboard";
import FloresTaskDescription from "../components/FloresComponents/FloresTaskDescription";
import FloresPairsLeaderBoard from "../components/FloresComponents/FloresPairsLeaderboard";

const FLORES_TASK_NAMES = [
  "Flores MT Evaluation (African)",
  "Flores MT Evaluation (FULL)",
  "Flores MT Evaluation (Small task 1)",
  "Flores MT Evaluation (Small task 2)",

];

export const FLORES_TASK_CODES = [
  "flores_african",
  "flores_full",
  "flores_small1",
  "flores_small2",

];

const TaskNav = ({ location, taskLookup, taskId, setTask }) => {
  return (
    <Nav className="sidebar-wrapper sticky-top">
      {FLORES_TASK_NAMES.map((name, index) => {
        const task = taskLookup[name];
        return (
          <Nav.Item key={index}>
            <Nav.Link
              href={`#${task.id}`}
              onClick={(e) => {
                e.preventDefault();
                setTask(task);
                // location.hash = `${t.id}`;
              }}
              className={`${
                taskId === task.id ? "active" : ""
              } gray-color p-3 px-lg-5 flores-nav-item`}
            >
              {task.name}
            </Nav.Link>
          </Nav.Item>
        );
      })}
    </Nav>
  );
};

const FloresTaskPage = (props) => {
  const context = useContext(UserContext); // for API
  const [taskLookup, setTaskLookup] = useState({}); // All Flores Tasks
  const [task, setTask] = useState(null); // Current Task ID
  const [isLoading, setIsLoading] = useState(false);

  let { taskName } = useParams();

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
            FLORES_TASK_NAMES.includes(t.name)
          );
          const taskLookup = floresTasks.reduce(
            // eslint-disable-next-line
            (map, obj) => ((map[obj.name] = obj), map),
            {}
          );
          setTaskLookup(taskLookup);
          if (FLORES_TASK_NAMES.includes(taskName)) {
            setTask(taskLookup[taskName]); // set the task from Arguments
          } else {
            setTask(taskLookup[FLORES_TASK_NAMES[0]]); // set default task
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
  }, [context.api, taskName]);

  if (isLoading || !task) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

const geturl = () => {return [
  "Flores MT Evaluation (FULL)",
  "Flores MT Evaluation (Small task 1)",
  "Flores MT Evaluation (Small task 2)"
  ].includes(task.name)?"http://data.statmt.org/wmt21/multilingual-task/":"https://statmt.org/wmt22/large-scale-multilingual-translation-task.html"}
  return (
    <OverlayProvider initiallyHide={true} delayMs="1700">
      <Container fluid>
        <Row>
          <Col lg={2} className="p-0 border">
            <Annotation
              placement="bottom-start"
              tooltip="The Flores task has multiple tracks. You can look at other tracks here"
            >
              <TaskNav
                {...props}
                taskLookup={taskLookup}
                taskId={task.id}
                setTask={setTask}
              />
            </Annotation>
          </Col>
          <Col lg={10} className="px-4 px-lg-5">
            <img
              src="/flores_logo.png"
              style={{ height: "60px", marginTop: "48px" }}
              alt="flores logo"
            />
            <div style={{ float: "right", marginTop: 30 }}>
              <ButtonGroup>
                <Annotation
                  placement="left"
                  tooltip="Click to show help overlay"
                >
                  <OverlayContext.Consumer>
                    {({ hidden, setHidden }) => (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm btn-help-info"
                        onClick={() => {
                          setHidden(!hidden);
                        }}
                      >
                        <i className="fas fa-question"></i>
                      </button>
                    )}
                  </OverlayContext.Consumer>
                </Annotation>
              </ButtonGroup>
            </div>
            <p>
              {" "}
              FLORES is a benchmark dataset for machine translation between
              English and low-resource languages.{" "}
            </p>
            <hr />
            <FloresTaskDescription taskName={task.name} taskDesc={task.desc} />
            <FloresActionButtons
              api={context.api}
              taskId={task.id}
              user={context.user}
            />
            <p>
              The training data is provided by the publicly available Opus
              repository, which contains data of various quality from a variety
              of domains. We also provide in-domain Wikipedia monolingual data
              for each language. All tracks will be fully constrained, so only
              the data that is provided can be used. This will enable fairer
              comparison across methods. Check the{" "}
              <a
                //href="http://data.statmt.org/wmt21/multilingual-task/"
                href = {geturl()}
                target="_blank"
                rel="noreferrer"
              >
                multilingual data page
              </a>{" "}
              for a detailed view of the resources.
            </p>

            <Row className="mt-2">
              <Annotation
                placement="top-end"
                tooltip="This shows how models have performed on a specific track"
              >
                <FloresModelLeaderBoard
                  {...props}
                  taskId={task.id}
                  taskCode={task.task_code}
                />
              </Annotation>
              <Annotation
                placement="top-end"
                tooltip="Best BLEU scores on specific language pairs. Filter by source and target language"
              >
                <FloresPairsLeaderBoard
                  {...props}
                  taskTitle={task?.name}
                  taskId={task.id}
                />
              </Annotation>
            </Row>
          </Col>
        </Row>
      </Container>
    </OverlayProvider>
  );
};

export default FloresTaskPage;
