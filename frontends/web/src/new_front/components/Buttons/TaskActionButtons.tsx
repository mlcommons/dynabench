/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { FC } from "react";
import { Button, Nav, OverlayTrigger } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Annotation } from "../../../containers/Overlay";
import ShowToolTip from "../Utils/ShowToolTip";
const yaml = require("js-yaml");

type TaskActionButtonsProps = {
  configYaml: string;
  dynamicAdversarialDataCollection: number;
  submitable: number;
  hasPredictionsUpload: number;
  taskCode: string;
  taskDocumentationUrl: string;
};

const TaskActionButtons: FC<TaskActionButtonsProps> = ({
  configYaml,
  dynamicAdversarialDataCollection,
  submitable,
  hasPredictionsUpload,
  taskCode,
  taskDocumentationUrl,
}) => {
  const { t } = useTranslation();
  const hasTrainFileUpload =
    configYaml && yaml.load(configYaml).hasOwnProperty("train_file_metric");

  return (
    <Nav className="my-4">
      {dynamicAdversarialDataCollection && (
        <>
          <Nav.Item className="task-action-btn">
            <Annotation
              placement="bottom"
              tooltip={t("tasks:create.tooltipCreate")}
            >
              <OverlayTrigger
                placement="bottom"
                delay={{ show: 250, hide: 400 }}
                overlay={() =>
                  ShowToolTip(t("tasks:create.tooltipCreateDetail"))
                }
              >
                <Button
                  as={Link}
                  className="mr-2 border-0 font-weight-bold light-gray-bg"
                  to={`/tasks/${taskCode}/create`}
                >
                  <i className="fas fa-pen"></i> {t("tasks:create.title")}
                </Button>
              </OverlayTrigger>
            </Annotation>
          </Nav.Item>
          <Nav.Item className="task-action-btn">
            <Annotation
              placement="top"
              tooltip={t("tasks:validate.tooltipValidate")}
            >
              <OverlayTrigger
                placement="bottom"
                delay={{ show: 250, hide: 400 }}
                overlay={() =>
                  ShowToolTip(t("tasks:validate.tooltipValidateDetail"))
                }
              >
                <Button
                  as={Link}
                  className="mr-2 border-0 font-weight-bold light-gray-bg"
                  to={`/tasks/${taskCode}/validate`}
                >
                  <i className="fas fa-search"></i> {t("tasks:validate.title")}
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
            tooltip={t("tasks:submitModels.tooltip")}
          >
            <OverlayTrigger
              placement="bottom"
              delay={{ show: 250, hide: 400 }}
              overlay={() => ShowToolTip("")}
            >
              <Button
                as={Link}
                className="mr-2 border-0 font-weight-bold light-gray-bg"
                to={`/tasks/${taskCode}/uploadModel`}
              >
                <i className="fas fa-upload"></i>{" "}
                {t("tasks:submitModels.title")}
              </Button>
            </OverlayTrigger>
          </Annotation>
        </Nav.Item>
      )}
      {hasPredictionsUpload && (
        <Nav.Item className="task-action-btn">
          <Annotation
            placement="top"
            tooltip={t("tasks:submitPredictions.tooltip")}
          >
            <OverlayTrigger
              placement="bottom"
              delay={{ show: 250, hide: 400 }}
              overlay={() =>
                ShowToolTip(t("tasks:validate.tooltipValidateDetail"))
              }
            >
              <Button
                as={Link}
                className="mr-2 border-0 font-weight-bold light-gray-bg"
                to={"/tasks/" + taskCode + "/submit_predictions"}
              >
                <i className="fa fa-upload"></i>{" "}
                {t("tasks:submitPredictions.title")}
              </Button>
            </OverlayTrigger>
          </Annotation>
        </Nav.Item>
      )}
      {taskDocumentationUrl && (
        <Nav.Item className="task-action-btn">
          <Annotation
            placement="top"
            tooltip={t("tasks:documentation.tooltip")}
          >
            <OverlayTrigger
              placement="bottom"
              delay={{ show: 250, hide: 400 }}
              overlay={() => ShowToolTip(t("tasks:documentation.tooltip"))}
            >
              <Button
                onClick={() => window.open(taskDocumentationUrl, "_blank")}
                className="mr-2 border-0 font-weight-bold light-gray-bg"
              >
                <i className="fa fa-file"></i> {t("tasks:documentation.title")}
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
              tooltip={t("tasks:submitFiles.tooltip")}
            >
              <OverlayTrigger
                placement="bottom"
                delay={{ show: 250, hide: 400 }}
                overlay={() =>
                  ShowToolTip(t("tasks:validate.tooltipValidateDetail"))
                }
              >
                <>
                  <Button
                    as={Link}
                    className="mr-2 border-0 font-weight-bold light-gray-bg"
                    to={"/tasks/" + taskCode + "/submit_train_files"}
                  >
                    <i className="fa fa-upload"></i>{" "}
                    {t("tasks:submitFiles.title")}
                  </Button>
                </>
              </OverlayTrigger>
            </Annotation>
          </Nav.Item>
          <Nav.Item className="task-action-btn">
            <Annotation
              placement="top"
              tooltip={t("tasks:mlcubeTutorial.tooltip")}
            >
              <OverlayTrigger
                placement="bottom"
                delay={{ show: 250, hide: 400 }}
                overlay={() =>
                  ShowToolTip(t("tasks:validate.tooltipValidateDetail"))
                }
              >
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
              </OverlayTrigger>
            </Annotation>
          </Nav.Item>
        </>
      )}
    </Nav>
  );
};

export default TaskActionButtons;
