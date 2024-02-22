import React, { FC } from "react";
import { Collapse, FormControl } from "react-bootstrap";

type BasicInputSelectOptionProps = {
  placeholder: string | undefined;
  open?: boolean;
  disabled?: boolean;
  required?: boolean;
  field_name_for_the_model?: string;
  options: any[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

const BasicInputSelectOption: FC<BasicInputSelectOptionProps> = ({
  placeholder,
  open = true,
  disabled = false,
  required = true,
  field_name_for_the_model = "",
  options,
  onChange,
  onEnter,
}) => {
  return (
    <Collapse in={open}>
      <div className="grid grid-cols-3 gap-1">
        <div className="col-span-2">
          <FormControl
            className="p3 h-10 rounded-1 thick-border bg-[#f0f2f5]"
            placeholder={placeholder}
            onChange={onChange}
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                onEnter && onEnter(e);
              }
            }}
            disabled={disabled}
            required={required}
          />
        </div>
        <div className="col-span-1">
          <ul className="flex flex-row gap-1 pt-1">
            {options.map((option, index) => {
              return (
                <li
                  className="w-full border-gray-600 rounded-t-lg"
                  key={option}
                >
                  <div className="flex items-center pl-3">
                    <label
                      htmlFor={`option_${index}`}
                      className="flex items-center font-bold"
                    >
                      <input
                        type="radio"
                        id={`option_${index}`}
                        name={field_name_for_the_model}
                        value={option}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Collapse>
  );
};

export default BasicInputSelectOption;
