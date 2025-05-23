import React, { FC, useState } from "react";
import { Collapse } from "react-bootstrap";
import parse from "html-react-parser";

type HorizontalRadioButtonProps = {
  options: string[];
  instructions: string;
  field_name_for_the_model?: string;
  metadata?: boolean;
  InitialOpen?: boolean;
  disabled?: boolean;
  onInputChange?: (value: any, metadata: boolean) => void;
};

const HorizontalRadioButton: FC<HorizontalRadioButtonProps> = ({
  options,
  instructions,
  field_name_for_the_model,
  metadata,
  InitialOpen = true,
  disabled,
  onInputChange,
}) => {
  const [open, setOpen] = useState(InitialOpen);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    undefined,
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
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
        <h3 className="mb-1 text-base normal-case text-letter-color">
          {open ? (
            <i className="pl-2 pr-3 fas fa-minus" />
          ) : (
            <i className="pl-2 pr-3 fas fa-plus" />
          )}
          {parse(instructions)}
        </h3>
      </div>
      <Collapse in={open} className="margin">
        <div className="justify-center flex w-full mt-2">
          <ul className="w-fit grid grid-cols-2 sm:flex sm:flex-wrap gap-4 text-sm font-medium text-letter-color">
            {options.map((option, index) => (
              <li
                className="px-3 flex flex-col items-center w-full sm:w-auto"
                key={`HRB-${index}`}
              >
                <label className="text-base font-medium text-letter-color">
                  {parse(option)}
                </label>
                <input
                  type="radio"
                  value={option}
                  name={field_name_for_the_model}
                  checked={selectedOption === option}
                  className="w-4 h-5 bg-gray-100 border-gray-300 rounded text-third-color focus:ring-third-color"
                  onChange={handleChange}
                  disabled={disabled}
                  id={`${field_name_for_the_model}-${index}`}
                />
              </li>
            ))}
          </ul>
        </div>
      </Collapse>
    </div>
  );
};

export default HorizontalRadioButton;
