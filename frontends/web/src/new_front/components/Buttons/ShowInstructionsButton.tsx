import { OverlayInstructionsContext } from "new_front/context/OverlayInstructions/Context";
import React, { FC } from "react";

type ShowInstructionsButtonProps = {
  color?: "black" | "white";
};

const ShowInstructionsButton = ({
  color = "black",
}: ShowInstructionsButtonProps) => {
  const { hidden, setHidden } = React.useContext(OverlayInstructionsContext);
  return (
    <button
      type="button"
      className={
        color === "black"
          ? "mr-1 text-black border-black btn btn-outline-primary btn-sm btn-help-info"
          : "mr-1 text-white border-white btn btn-outline-primary btn-sm btn-help-info"
      }
      onClick={() => {
        setHidden(!hidden);
      }}
    >
      <i className="fas fa-question"></i>
    </button>
  );
};
export default ShowInstructionsButton;
