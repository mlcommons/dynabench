import parse from "html-react-parser";
import React, { FC, useState } from "react";
import { Collapse } from "react-bootstrap";
import SimpleInputMultiSelect from "../Inputs/SimpleInputMultiSelect";

type MultiSelectProps = {
  options: string[];
  instructions: string;
  field_name_for_the_model?: string;
  metadata?: boolean;
  onInputChange?: (data: any, metadata?: boolean) => void;
};

const MultiSelect: FC<MultiSelectProps> = ({
  options,
  instructions,
  field_name_for_the_model,
  metadata,
  onInputChange,
}) => {
  const selected: string[] = [];
  const [open, setOpen] = useState(false);
  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    option: string
  ) => {
    if (field_name_for_the_model) {
      if (event.target.checked) {
        selected.push(option);
      } else {
        const index = selected.indexOf(option);
        if (index > -1) {
          selected.splice(index, 1);
        }
      }
      onInputChange!(
        {
          [field_name_for_the_model]: selected,
        },
        metadata
      );
    }
  };

  return (
    <div className="py-2 ">
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
          {parse(instructions)}
        </h3>
      </div>
      <Collapse in={open}>
        <ul className="w-full text-sm font-medium text-letter-color ">
          {options.map((option, index) => (
            <li className="w-full border-gray-600 rounded-t-lg" key={index}>
              <SimpleInputMultiSelect
                option={option}
                handleChange={handleChange}
              />
            </li>
          ))}
        </ul>
      </Collapse>
    </div>
  );
};
export default MultiSelect;
