import parse from "html-react-parser";
import React, { FC, useState } from "react";
import { Collapse } from "react-bootstrap";
import DropDown from "../Inputs/Dropdown";

type DropDownWithInstructionsProps = {
  options: string[];
  instructions: string;
  field_name_for_the_model?: string;
  metadata?: boolean;
  onInputChange?: (data: any, metadata?: boolean) => void;
};

const DropDownWithInstructions: FC<DropDownWithInstructionsProps> = ({
  options,
  instructions,
  field_name_for_the_model,
  metadata,
  onInputChange,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    undefined
  );
  const handleChange = (option: string) => {
    setSelectedOption(option);
    if (field_name_for_the_model) {
      onInputChange!(
        {
          [field_name_for_the_model]: option,
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
        <div className="p-3">
          {open && (
            <DropDown
              options={options}
              placeholder={selectedOption || "Select between the options"}
              onChange={handleChange}
            />
          )}
        </div>
      </Collapse>
    </div>
  );
};
export default DropDownWithInstructions;
