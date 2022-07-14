/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Button, Nav, Tooltip, OverlayTrigger } from "react-bootstrap";
import { Annotation } from "../../containers/Overlay";
import { Link } from "react-router-dom";
import SubmitModel from "../../containers/SubmitModel";

const FloresActionButtons = () => {
  function renderTooltip(props, text) {
    return (
      <Tooltip id="button-tooltip" {...props}>
        {text}
      </Tooltip>
    );
  }

  function renderSubmitTooltip(props) {
    return renderTooltip(props, "Submit models for this task");
  }

  return (
    <Nav className="my-4">
      <Nav.Item className="task-action-btn">
        <Annotation
          placement="bottom-start"
          tooltip="Click here to submit your model through Dynalab."
        >
          <OverlayTrigger
            placement="bottom"
            delay={{ show: 250, hide: 400 }}
            overlay={renderSubmitTooltip}
          >
            <Button
              as={Link}
              className="border-0 blue-color font-weight-bold light-gray-bg"
              to={`/tasks/18/uploadModel`}
            >
              <i className="fas fa-upload"></i> Submit Models
            </Button>
          </OverlayTrigger>
        </Annotation>
      </Nav.Item>
    </Nav>
  );
};

export default FloresActionButtons;
