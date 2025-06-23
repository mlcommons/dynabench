/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import React, { FC } from "react";
import { Button, Nav } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const yaml = require("js-yaml");

type TaskActionButtonsProps = {
  configYaml: string;
  dynamicAdversarialDataCollection: boolean;
  dynamicAdversarialDataValidation: boolean;
  submitable: boolean;
  hasPredictionsUpload: boolean;
  taskCode: string;
  MLCubeTutorialMarkdown: string;
  submitablePredictions: boolean;
};

const TaskActionButtons: FC<TaskActionButtonsProps> = ({
  configYaml,
  dynamicAdversarialDataCollection,
  dynamicAdversarialDataValidation,
  submitable,
  hasPredictionsUpload,
  taskCode,
  MLCubeTutorialMarkdown,
  submitablePredictions,
}) => {
  const { t } = useTranslation();
  const hasTrainFileUpload =
    configYaml && yaml.load(configYaml).hasOwnProperty("train_file_metric");

  return (
    <Nav className="my-2">
      {dynamicAdversarialDataCollection && (
        <>
          <Nav.Item className="task-action-btn">
            <AnnotationInstruction
              placement="bottom"
              tooltip={t("tasks:create.tooltipCreate")}
            >
              <Button
                as={Link}
                className="mr-2 border-0 font-weight-bold light-gray-bg"
                to={`/tasks/${taskCode}/create`}
              >
                <i className="fas fa-pen"></i> {t("tasks:create.title")}
              </Button>
            </AnnotationInstruction>
          </Nav.Item>
        </>
      )}
      {dynamicAdversarialDataValidation && (
        <>
          <Nav.Item className="task-action-btn">
            <Button
              as={Link}
              className="mr-2 border-0 font-weight-bold light-gray-bg"
              to={`/tasks/${taskCode}/validate`}
            >
              <i className="fas fa-search"></i> {t("tasks:validate.title")}
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
            <i className="fas fa-upload"></i> {t("tasks:submitModels.title")}
          </Button>
        </Nav.Item>
      )}
      {hasPredictionsUpload && (
        <Nav.Item className="task-action-btn">
          <Button
            as={Link}
            className="mr-2 border-0 font-weight-bold light-gray-bg"
            to={"/tasks/" + taskCode + "/submit_predictions"}
          >
            <i className="fa fa-upload"></i>{" "}
            {t("tasks:submitPredictions.title")}
          </Button>
        </Nav.Item>
      )}
      {submitablePredictions && (
        <Nav.Item className="task-action-btn">
          <Button
            as={Link}
            className="mr-2 border-0 font-weight-bold light-gray-bg"
            to={"/tasks/" + taskCode + "/submit_prediction"}
          >
            <i className="fa fa-upload"></i>{" "}
            {t("tasks:submitPredictions.title")}
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
                <i className="fa fa-upload"></i> {t("tasks:submitFiles.title")}
              </Button>
            </>
          </Nav.Item>
          {MLCubeTutorialMarkdown && (
            <Nav.Item className="task-action-btn">
              <>
                <Button
                  as={Link}
                  className="mr-2 border-0 font-weight-bold light-gray-bg"
                  to={"/tasks/" + taskCode + "/mlcube_tutorial"}
                >
                  <i className="fa fa-upload"></i>{" "}
                  {t("tasks:mlcubeTutorial.title")}
                </Button>
              </>
            </Nav.Item>
          )}
        </>
      )}
    </Nav>
  );
};

export default TaskActionButtons;
