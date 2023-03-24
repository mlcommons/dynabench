import React, { FC } from "react";
import { Collapse, FormControl } from "react-bootstrap";

type BasicInputProps = {
  placeholder: string | undefined;
  open?: boolean;
  disabled?: boolean;
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const BasicInput: FC<BasicInputProps> = ({
  onChange,
  placeholder,
  open = true,
  disabled = false,
  required = true,
}) => {
  return (
    <Collapse in={open}>
      <FormControl
        className="p-3 h-12 rounded-1 thick-border bg-[#f0f2f5]"
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
        required={required}
      />
    </Collapse>
  );
};

export default BasicInput;
