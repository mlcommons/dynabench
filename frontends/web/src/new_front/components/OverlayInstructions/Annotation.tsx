import { OverlayInstructionsContext } from "new_front/context/OverlayInstructions/Context";
import React, { FC, ReactElement, useContext } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

type AnnotationInstructionWrapperProps = {
  children: ReactElement;
  tooltip: string;
  placement?: "top" | "right" | "bottom" | "left";
};

const AnnotationInstruction: FC<AnnotationInstructionWrapperProps> = ({
  children,
  tooltip,
  placement,
}) => {
  const { hidden } = useContext(OverlayInstructionsContext);
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
