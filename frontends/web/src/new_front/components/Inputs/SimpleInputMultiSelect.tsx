import React, { FC } from "react";
import parse from "html-react-parser";

type SimpleInputMultiSelectProps = {
  option: string;
  handleChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    option: string
  ) => void;
};

const SimpleInputMultiSelect: FC<SimpleInputMultiSelectProps> = ({
  option,
  handleChange,
}) => {
  return (
    <div className="flex items-center pl-3">
      <input
        id="vue-checkbox"
        type="checkbox"
        onChange={(event) => handleChange(event, option)}
        className="w-4 h-5 bg-gray-100 border-gray-300 rounded text-third-color focus:ring-third-color"
      />
      <label className="w-full pt-2 ml-2 text-base font-medium text-letter-color">
        {parse(option)}
      </label>
    </div>
  );
};

export default SimpleInputMultiSelect;
