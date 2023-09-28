import React, { FC, useState, useEffect } from "react";
import { Collapse } from "react-bootstrap";
import parse from "html-react-parser";

type RadioButtonProps = {
  options: string[];
  instructions: string;
  field_name_for_the_model?: string;
  metadata?: boolean;
  InitialOpen?: boolean;
  onInputChange?: (value: any, metadata: boolean) => void;
};

const RadioButton: FC<RadioButtonProps> = ({
  options,
  instructions,
  field_name_for_the_model,
  metadata,
  InitialOpen = true,
  onInputChange,
}) => {
  const [open, setOpen] = useState(InitialOpen);
  const [selectedOption, setSelectedOption] = useState<string>(
    options[0] || "",
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (field_name_for_the_model && onInputChange) {
      onInputChange(
        {
          [field_name_for_the_model]: event.target.value,
        },
        metadata || false,
      );
    }
  };

  return (
    <div key="" className="py-2">
      <div
        className="flex items-center h-16 px-1 space-x-10 transition cursor-pointer hover:bg-[#eef2ff]"
        onClick={() => setOpen(!open)}
      >
        <h3 className="mb-1 text-base font-semibold normal-case text-letter-color">
          {open ? (
            <i className="pl-2 pr-3 fas fa-minus" />
          ) : (
            <i className="pl-2 pr-3 fas fa-plus" />
          )}
          {parse(instructions)}
        </h3>
      </div>
      <Collapse in={open}>
        <ul className="w-full text-sm font-medium text-letter-color">
          {options.map((option, index) => (
            <li className="w-full rounded-t-lg " key={index}>
              <div className="flex items-center pl-3">
                <input
                  type="radio"
                  value={option}
                  name="radio"
                  className="w-4 h-5 bg-gray-100 border-gray-300 rounded text-third-color focus:ring-third-color"
                  onChange={handleChange}
                />
                <label
                  className="w-full pt-2 ml-2 text-base font-medium text-letter-color"
                  defaultValue={selectedOption}
                >
                  {parse(option)}
                </label>
              </div>
            </li>
          ))}
        </ul>
      </Collapse>
    </div>
  );
};

export default RadioButton;
