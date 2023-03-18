import React, { FC } from "react";

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
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (field_name_for_the_model && onInputChange) {
      onInputChange({
        [field_name_for_the_model]: event.target.value,
      });
    }
  };

  return (
    <div key="" className="py-2 pl-4 border border-gray-200 rounded-lg">
      <h3 className="mb-1 font-semibold text-gray-900 ">{instructions}</h3>
      <ul className="w-full text-sm font-medium text-gray-900">
        {options.map((option, index) => (
          <li className="w-full rounded-t-lg dark:border-gray-600" key={index}>
            <div className="flex items-center pl-3">
              <input
                type="radio"
                value={option}
                name="radio"
                className="w-4 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                onChange={handleChange}
              />
              <label className="w-full pt-2 ml-2 text-base font-medium text-gray-900 dark:text-gray-300">
                {option}
              </label>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RadioButton;
