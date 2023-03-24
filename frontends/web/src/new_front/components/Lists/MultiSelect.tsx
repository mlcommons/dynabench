import React, { FC, useState } from "react";
import { Collapse } from "react-bootstrap";

type MultiSelectProps = {
  options: string[];
  instructions: string;
  field_name_for_the_model?: string;
  onInputChange?: (value: any) => void;
};

const MultiSelect: FC<MultiSelectProps> = ({
  options,
  instructions,
  field_name_for_the_model,
  onInputChange,
}) => {
  const selected: string[] = [];
  const [open, setOpen] = useState(false);
  const [addExplanation, setAddExplanation] = useState(false);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    option: string
  ) => {
    setAddExplanation(!addExplanation);
    if (field_name_for_the_model && onInputChange) {
      if (event.target.checked) {
        selected.push(option);
      } else {
        const index = selected.indexOf(option);
        if (index > -1) {
          selected.splice(index, 1);
        }
      }
      onInputChange({
        [field_name_for_the_model]: selected,
      });
    }
  };

  return (
    <div className="py-2  ">
      <h3
        className="mb-1 font-semibold text-letter-color pointer"
        onClick={() => setOpen(!open)}
      >
        {instructions} ↆ
      </h3>
      <Collapse in={open}>
        <ul className="w-full text-sm font-medium text-letter-color ">
          {options.map((option, index) => (
            <li
              className="w-full rounded-t-lg dark:border-gray-600"
              key={index}
            >
              <div className="flex items-center pl-3">
                <input
                  id="vue-checkbox"
                  type="checkbox"
                  onChange={(event) => handleChange(event, option)}
                  className="w-4 h-5 text-third-color bg-gray-100 border-gray-300 rounded focus:ring-third-color"
                />
                <label className="w-full pt-2 ml-2 text-base font-medium dark:text-gray-300">
                  {option}
                </label>
                <input
                  placeholder="Please specify"
                  className={`${
                    addExplanation ? "block" : "hidden"
                  } px-2 py-1 text-base text-letter-color border border-gray-300 rounded-md w-2/4  `}
                  type="text"
                  onChange={(event) => {
                    setAddExplanation(true);
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Collapse>
    </div>
  );
};
export default MultiSelect;
