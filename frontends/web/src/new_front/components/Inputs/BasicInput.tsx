import React, { FC } from "react";
import { FormControl } from "react-bootstrap";

type BasicInputProps = {
  placeholder: string | undefined;
  disabled?: boolean;
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const BasicInput: FC<BasicInputProps> = ({
  onChange,
  placeholder,
  disabled = false,
  required = true,
}) => {
  return (
    <FormControl
      className="p-3 h-12 rounded-1 thick-border bg-[#f0f2f5]"
      placeholder={placeholder}
      onChange={onChange}
      required={required}
      disabled={disabled}
    />
  );
};

export default BasicInput;
