import React, { FC } from "react";
import { Collapse, FormControl } from "react-bootstrap";

type BasicInputProps = {
  placeholder: string;
  open?: boolean;
  disabled?: boolean;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

const BasicInputRemain: FC<BasicInputProps> = ({
  placeholder,
  open = true,
  disabled = false,
  required = true,
  value = "",
  onChange,
  onEnter,
}) => {
  return (
    <Collapse in={open}>
      {placeholder ===
      "People from {region} doing a {local activity}. Eg. 'Old Bhopalis sitting near 10 number market'." ? (
        <FormControl
          className="p-3 h-12 rounded-1 thick-border bg-[#f0f2f5]"
          placeholder={placeholder}
          onChange={onChange}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              onEnter && onEnter(e);
            }
          }}
          value=""
          disabled={disabled}
          required={required}
        />
      ) : (
        <FormControl
          className="p-3 h-12 rounded-1 thick-border bg-[#f0f2f5]"
          placeholder={placeholder}
          onChange={onChange}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              onEnter && onEnter(e);
            }
          }}
          value={placeholder}
          disabled={disabled}
          required={required}
        />
      )}
    </Collapse>
  );
};

export default BasicInputRemain;
