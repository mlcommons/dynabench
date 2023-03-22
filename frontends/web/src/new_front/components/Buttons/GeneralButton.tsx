import React, { FC } from "react";
import { Button } from "react-bootstrap";

type GeneralButtonProps = {
  text: string;
  className: string;
  onClick: () => void;
};

const GeneralButton: FC<GeneralButtonProps> = ({
  text,
  className,
  onClick,
}) => {
  return (
    <Button className={className} onClick={onClick}>
      {text}
    </Button>
  );
};

export default GeneralButton;
