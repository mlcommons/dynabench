/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useContext, useEffect, useState } from "react";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import Markdown from "react-markdown";
import { Link } from "react-router-dom";
import UserContext from "../containers/UserContext";

const MLCubeTutorial = (props) => {
  const context = useContext(UserContext);
  const [tutorial, setTutorial] = useState("");
  const [loading, setLoading] = useState({
    loading: true,
    text: "",
  });
  useEffect(() => {
    const fetchTaskData = async () => {
      const taskData = await context.api.getTask(props.match.params.taskId);
      setTutorial(taskData.mlcube_tutorial_markdown);
      if (!context.api.loggedIn()) {
        props.history.push(
          "/login?msg=" +
            encodeURIComponent(
              "Please sign up or log in so that you can upload a model"
            ) +
            "&src=" +
            encodeURIComponent(
              `/tasks/${props.match.params.taskId}/mlcube_tutorial`
            )
        );
      } else {
        setLoading({ loading: true, text: "Loading" });
      }
    };
    fetchTaskData();
  }, [tutorial]);
  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">MLCube Tutorial</h1>
      <Col>
        <Card className="my-4">
          <Card.Body>
            <>
              <form className="px-4">
                <Container>
                  <Form.Group as={Row} className="py-3 my-0">
                    <p>
                      <Markdown>{tutorial}</Markdown>
                    </p>
                  </Form.Group>
                  <center>
                    <Button
                      as={Link}
                      className="text-center border-0 blue-color font-weight-bold light-gray-bg"
                      to={
                        "/tasks/" +
                        props.match.params.taskId +
                        "/submit_train_files"
                      }
                    >
                      <i className="fa fa-upload"></i> Submit Train Files
                    </Button>
                  </center>
                </Container>
              </form>
            </>
          </Card.Body>
        </Card>
      </Col>
    </Container>
  );
};

export default MLCubeTutorial;
