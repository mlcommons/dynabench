/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import React, { FC } from "react";
import { Button, Nav } from "react-bootstrap";
import { Link } from "react-router-dom";

const yaml = require("js-yaml");

type TaskActionButtonsProps = {
  configYaml: string;
  dynamicAdversarialDataCollection: number;
  submitable: number;
  hasPredictionsUpload: number;
  taskCode: string;
};

const TaskActionButtons: FC<TaskActionButtonsProps> = ({
  configYaml,
  dynamicAdversarialDataCollection,
  submitable,
  hasPredictionsUpload,
  taskCode,
}) => {
  const hasTrainFileUpload =
    configYaml && yaml.load(configYaml).hasOwnProperty("train_file_metric");

  return (
    <Nav className="my-2">
      {dynamicAdversarialDataCollection && (
        <>
          <Nav.Item className="task-action-btn">
            <AnnotationInstruction
              placement="bottom"
              tooltip="Click here to get creative and start writing examples that fool the model"
            >
              <Button
                as={Link}
                className="mr-2 border-0 font-weight-bold light-gray-bg"
                to={`/tasks/${taskCode}/create`}
              >
                <i className="fas fa-pen"></i> Create Examples
              </Button>
            </AnnotationInstruction>
          </Nav.Item>
          <Nav.Item className="task-action-btn">
            <Button
              as={Link}
              className="mr-2 border-0 font-weight-bold light-gray-bg"
              to={`/tasks/${taskCode}/validate`}
            >
              <i className="fas fa-search"></i> Validate Examples
            </Button>
          </Nav.Item>
        </>
      )}
      {submitable && (
        <Nav.Item className="task-action-btn">
          <Button
            as={Link}
            className="mr-2 border-0 font-weight-bold light-gray-bg"
            to={`/tasks/${taskCode}/uploadModel`}
          >
            <i className="fas fa-upload"></i> Submit Models
          </Button>
        </Nav.Item>
      )}
      {hasPredictionsUpload !== 0 && (
        <Nav.Item className="task-action-btn">
          <Button
            as={Link}
            className="mr-2 border-0 font-weight-bold light-gray-bg"
            to={"/tasks/" + taskCode + "/submit_predictions"}
          >
            <i className="fa fa-upload"></i> Submit Prediction Files
          </Button>
        </Nav.Item>
      )}
      {hasTrainFileUpload && (
        <>
          <Nav.Item className="task-action-btn">
            <>
              <Button
                as={Link}
                className="mr-2 border-0 font-weight-bold light-gray-bg"
                to={"/tasks/" + taskCode + "/submit_train_files"}
              >
                <i className="fa fa-upload"></i> Submit Files
              </Button>
            </>
          </Nav.Item>
          <Nav.Item className="task-action-btn">
            <>
              <Button
                as={Link}
                className="mr-2 border-0 font-weight-bold light-gray-bg"
                to={"/tasks/" + taskCode + "/mlcube_tutorial"}
              >
                <i className="fa fa-upload"></i> MLCube Tutorial
              </Button>
            </>
          </Nav.Item>
        </>
      )}
    </Nav>
  );
};

export default TaskActionButtons;
