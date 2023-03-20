import React, { FC } from "react";

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

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    option: string
  ) => {
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
    <div className="py-2 pl-4 border border-gray-200 rounded-lg">
      <h3 className="mb-1 font-semibold text-gray-900 ">{instructions}</h3>
      <ul className="w-full text-sm font-medium text-gray-900 ">
        {options.map((option, index) => (
          <li className="w-full rounded-t-lg dark:border-gray-600" key={index}>
            <div className="flex items-center pl-3">
              <input
                id="vue-checkbox"
                type="checkbox"
                onChange={(event) => handleChange(event, option)}
                className="w-4 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 "
              />
              <label className="w-full pt-2 ml-2 text-base font-medium dark:text-gray-300">
                {option}
              </label>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
export default MultiSelect;
