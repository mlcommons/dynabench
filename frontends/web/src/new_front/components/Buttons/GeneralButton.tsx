import React, { FC } from "react";
import { Button } from "react-bootstrap";

type GeneralButtonProps = {
  text: string;
  className: string;
  onClick: () => void;
  disabled?: boolean;
};

const GeneralButton: FC<GeneralButtonProps> = ({
  text,
  className,
  onClick,
  disabled,
}) => {
  return (
    <Button className={className} onClick={onClick} disabled={disabled}>
      {text}
    </Button>
  );
};

export default GeneralButton;
