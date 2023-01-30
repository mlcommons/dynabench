/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Button, Nav, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Annotation } from "../Overlay";
const yaml = require("js-yaml");

const TaskActionButtons = ({
  config_yaml,
  dynamicAdversarialDataCollection,
  submitable,
  hasPredictionsUpload,
  taskCode,
}) => {
  const showToolTip = (text) => <Tooltip id="button-tooltip">{text}</Tooltip>;

  const hasTrainFileUpload =
    config_yaml && yaml.load(config_yaml).hasOwnProperty("train_file_metric");

  return (
    <Nav className="my-4">
      {dynamicAdversarialDataCollection && (
        <>
          <Nav.Item className="task-action-btn">
            <Annotation
              placement="bottom"
              tooltip="Click here to get creative and start writing examples that fool the model"
            >
              <OverlayTrigger
                placement="bottom"
                delay={{ show: 250, hide: 400 }}
                overlay={() =>
                  showToolTip("Create new examples where the model fails")
                }
              >
                <Button
                  as={Link}
                  className="border-0 font-weight-bold light-gray-bg"
                  to={`/tasks/${taskCode}/create`}
                >
                  <i className="fas fa-pen"></i> Create Examples
                </Button>
              </OverlayTrigger>
            </Annotation>
          </Nav.Item>
          <Nav.Item className="task-action-btn">
            <Annotation
              placement="top"
              tooltip="Click here to see examples created by others, and validate their correctness"
            >
              <OverlayTrigger
                placement="bottom"
                delay={{ show: 250, hide: 400 }}
                overlay={() =>
                  showToolTip("Verify examples where the model may have failed")
                }
              >
                <Button
                  as={Link}
                  className="border-0 font-weight-bold light-gray-bg"
                  to={`/tasks/${taskCode}/validate`}
                >
                  <i className="fas fa-search"></i> Validate Examples
                </Button>
              </OverlayTrigger>
            </Annotation>
          </Nav.Item>
        </>
      )}
      {submitable && (
        <Nav.Item className="task-action-btn">
          <Annotation
            placement="right"
            tooltip="Click here to upload your models for this task."
          >
            <OverlayTrigger
              placement="bottom"
              delay={{ show: 250, hide: 400 }}
              overlay={() => showToolTip("")}
            >
              <Button
                as={Link}
                className="border-0 font-weight-bold light-gray-bg"
                to={`/tasks/${taskCode}/uploadModel`}
              >
                <i className="fas fa-upload"></i> Submit Models
              </Button>
            </OverlayTrigger>
          </Annotation>
        </Nav.Item>
      )}
      {hasPredictionsUpload && (
        <Nav.Item className="task-action-btn">
          <Annotation
            placement="top"
            tooltip={
              "Click here to submit your model-generated prediction files"
            }
          >
            <OverlayTrigger
              placement="bottom"
              delay={{ show: 250, hide: 400 }}
              overlay={() =>
                showToolTip("Verify examples where the model may have failed")
              }
            >
              <Button
                as={Link}
                className="border-0 font-weight-bold light-gray-bg"
                to={"/tasks/" + taskCode + "/submit_predictions"}
              >
                <i className="fa fa-upload"></i> Submit Prediction Files
              </Button>
            </OverlayTrigger>
          </Annotation>
        </Nav.Item>
      )}
      {hasTrainFileUpload && (
        <>
          <Nav.Item className="task-action-btn">
            <Annotation
              placement="top"
              tooltip={
                "Click here to submit your train files to trigger the training of" +
                " a model and evaluation on our datasets"
              }
            >
              <OverlayTrigger
                placement="bottom"
                delay={{ show: 250, hide: 400 }}
                overlay={() =>
                  showToolTip("Verify examples where the model may have failed")
                }
              >
                <>
                  <Button
                    as={Link}
                    className="border-0 font-weight-bold light-gray-bg"
                    to={"/tasks/" + taskCode + "/submit_train_files"}
                  >
                    <i className="fa fa-upload"></i> Submit Files
                  </Button>
                </>
              </OverlayTrigger>
            </Annotation>
          </Nav.Item>
          <Nav.Item className="task-action-btn">
            <Annotation
              placement="top"
              tooltip={
                "Click here to submit your train files to trigger the training of" +
                " a model and evaluation on our datasets"
              }
            >
              <OverlayTrigger
                placement="bottom"
                delay={{ show: 250, hide: 400 }}
                overlay={() =>
                  showToolTip("Verify examples where the model may have failed")
                }
              >
                <>
                  <Button
                    as={Link}
                    className="border-0 font-weight-bold light-gray-bg"
                    to={"/tasks/" + taskCode + "/mlcube_tutorial"}
                  >
                    <i className="fa fa-upload"></i> MLCube Tutorial
                  </Button>
                </>
              </OverlayTrigger>
            </Annotation>
          </Nav.Item>
        </>
      )}
    </Nav>
  );
};

export default TaskActionButtons;
