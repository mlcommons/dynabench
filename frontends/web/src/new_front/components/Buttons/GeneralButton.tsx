import React, { FC } from "react";
import { Button } from "react-bootstrap";

type GeneralButtonProps = {
  text: string;
  className: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
};

const GeneralButton: FC<GeneralButtonProps> = ({
  text,
  className,
  onClick,
  disabled,
  active,
}) => {
  return (
    <Button
      className={className}
      onClick={onClick}
      disabled={disabled}
      active={active}
    >
      {text}
    </Button>
  );
};

export default GeneralButton;
