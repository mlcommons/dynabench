import React from "react";
import { Tooltip } from "react-bootstrap";

const ShowToolTip = (text: string) => {
  return <Tooltip id="button-tooltip">{text}</Tooltip>;
};

export default ShowToolTip;
