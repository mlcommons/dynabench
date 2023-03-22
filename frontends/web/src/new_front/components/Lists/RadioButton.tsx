import React, { FC, useState } from "react";
import { Collapse } from "react-bootstrap";

type RadioButtonProps = {
  options: string[];
  instructions: string;
  field_name_for_the_model?: string;
  onInputChange?: (value: any) => void;
};

const RadioButton: FC<RadioButtonProps> = ({
  options,
  instructions,
  field_name_for_the_model,
  onInputChange,
}) => {
  const [open, setOpen] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (field_name_for_the_model && onInputChange) {
      onInputChange({
        [field_name_for_the_model]: event.target.value,
      });
    }
  };

  return (
    <div key="" className="py-2">
      <h3
        className="mb-1 font-semibold text-letter-color pointer"
        onClick={() => setOpen(!open)}
      >
        {instructions} ↆ
      </h3>
      <Collapse in={open}>
        <ul className="w-full text-sm font-medium text-letter-color">
          {options.map((option, index) => (
            <li className="w-full rounded-t-lg " key={index}>
              <div className="flex items-center pl-3">
                <input
                  type="radio"
                  value={option}
                  name="radio"
                  className="w-4 h-5 text-third-color bg-gray-100 border-gray-300 rounded focus:ring-third-color"
                  onChange={handleChange}
                />
                <label className="w-full pt-2 ml-2 text-base font-medium dark:text-gray-300">
                  {option}
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
