import React, { FC } from "react";
import { Button } from "react-bootstrap";

type GeneralButtonProps = {
  text: string;
  onClick: () => void;
};

const GeneralButton: FC<GeneralButtonProps> = ({ text, onClick }) => {
  return (
    <Button
      className="bg-white border-0 font-weight-bold light-gray-bg task-action-btn"
      onClick={onClick}
    >
      {text}
    </Button>
  );
};

export default GeneralButton;
