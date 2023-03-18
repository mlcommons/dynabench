import React, { FC, ReactElement } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import {
  useOverlayContext,
  OverlayProvider,
} from "new_front/components/OverlayInstructions/Provider";

type AnnotationWrapperProps = {
  children: ReactElement;
  tooltip: string;
  placement?: "top" | "right" | "bottom" | "left";
  hidden: boolean;
};

const Annotation: FC<AnnotationWrapperProps> = ({
  children,
  tooltip,
  placement,
  hidden,
}) => {
  return (
    <OverlayProvider>
      <OverlayTrigger
        placement={placement || "top"}
        overlay={<Tooltip id="button-tooltip">{tooltip}</Tooltip>}
        show={!hidden}
        delay={{ show: 250, hide: 400 }}
      >
        {children}
      </OverlayTrigger>
    </OverlayProvider>
  );
};

export default Annotation;
