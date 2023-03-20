import React, { FC, ReactElement, useContext, useEffect } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import {
  OverlayProvider,
  OverlayContext,
} from "new_front/components/OverlayInstructions/Provider";

type AnnotationInstructionWrapperProps = {
  children: ReactElement;
  tooltip: string;
  placement?: "top" | "right" | "bottom" | "left";
  hidden: boolean;
};

const AnnotationInstruction: FC<AnnotationInstructionWrapperProps> = ({
  children,
  tooltip,
  placement,
  hidden,
}) => {
  return (
    <OverlayTrigger
      placement={placement || "top"}
      overlay={<Tooltip id="button-tooltip">{tooltip}</Tooltip>}
      show={!hidden}
      delay={{ show: 250, hide: 400 }}
    >
      {children}
    </OverlayTrigger>
  );
};

export default AnnotationInstruction;
