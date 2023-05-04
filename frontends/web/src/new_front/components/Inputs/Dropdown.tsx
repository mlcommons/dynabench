import React, { FC, useState } from "react";
import { Collapse } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";

type DropdownProps = {
  options: any[];
  placeholder: string;
  setPrompt: (prompt: any) => void;
  disabled?: boolean;
};

const Dropdown: FC<DropdownProps> = ({
  options,
  placeholder,
  setPrompt,
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
        <Typeahead
          id="basic-typeahead-single"
          labelKey="name"
          className="w-full py-2"
          options={options}
          placeholder={placeholder}
          disabled={disabled}
          emptyLabel="No prompts found"
          onChange={(selected) => {
            if (selected.length > 0) {
              setPrompt(selected[0]);
            }
          }}
        />
      </Collapse>
    </div>
  );
};

export default Dropdown;
