import React, { FC } from "react";
import { Collapse, FormControl } from "react-bootstrap";

type BasicInputProps = {
  placeholder: string | undefined;
  open?: boolean;
  disabled?: boolean;
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

const BasicInput: FC<BasicInputProps> = ({
  placeholder,
  open = true,
  disabled = false,
  required = true,
  onChange,
  onEnter,
}) => {
  return (
    <Collapse in={open}>
      <FormControl
        className="p3 h-10 rounded-1 thick-border bg-[#f0f2f5]"
        placeholder={placeholder}
        onChange={onChange}
        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") {
            onEnter && onEnter(e);
          }
        }}
        disabled={disabled}
        required={required}
      />
    </Collapse>
  );
};

export default BasicInput;
