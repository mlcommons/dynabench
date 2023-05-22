import React, { FC, useState } from "react";
import {
  Collapse,
  DropdownButton,
  Dropdown as BootsDropdown,
} from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";

type DropdownProps = {
  options: any[];
  placeholder: string;
  onChange: (prompt: any) => void;
  disabled?: boolean;
};

const Dropdown: FC<DropdownProps> = ({
  options,
  placeholder,
  onChange,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full py-2">
      <div
        className="flex items-center h-16 px-1 space-x-10 transition cursor-pointer hover:bg-[#eef2ff]"
        onClick={() => setOpen(!open)}
      >
        <h3 className="mb-1 text-base normal-case text-letter-color">
          {open ? (
            <i className="pl-2 pr-3 fas fa-minus" />
          ) : (
            <i className="pl-2 pr-3 fas fa-plus" />
          )}
          Prompt history
        </h3>
      </div>
      <Collapse in={open}>
        {/* <Typeahead
          id="basic-typeahead-single"
          labelKey="name"
          className="w-full py-2"
          options={options}
          placeholder={placeholder}
          disabled={disabled}
          emptyLabel="No prompts found"
          onChange={(selected) => {
            if (selected.length > 0) {
              onChange(selected[0])
            }
          }}
          clearButton
        /> */}
        <DropdownButton
          id="dropdown-basic-button"
          title={placeholder}
          className="flex justify-center w-full border-gray-200 "
        >
          {options.map((option) => (
            <BootsDropdown.Item onClick={() => onChange(option)}>
              {option}
            </BootsDropdown.Item>
          ))}
        </DropdownButton>
      </Collapse>
    </div>
  );
};

export default Dropdown;
