import parse from "html-react-parser";
import React, { FC, useState } from "react";
import { Collapse } from "react-bootstrap";

type SelectOptionWithSliderProps = {
  options: any[];
  instructions: string;
  optionsSlider: string[];
  field_name_for_the_model: string;
  metadata?: boolean;
  instructions_slider: string;
  onInputChange: (data: any, metadata?: boolean) => void;
};

const SelectOptionWithSlider: FC<SelectOptionWithSliderProps> = ({
  options,
  instructions,
  optionsSlider = ["0", "100"],
  field_name_for_the_model,
  metadata,
  instructions_slider,
  onInputChange,
}) => {
  const [open, setOpen] = useState(false);
  const [optionSelected, setOptionSelected] = useState(false);
  const [optionSelectedValue, setOptionSelectedValue] = useState("");

  const [responses, setResponses] = useState<any[]>(
    options.map((option) => {
      return { label: option.label, value: 50 };
    }),
  );

  const handleChange = (value: string, option: string) => {
    const updatedResponses = responses.map((response) => {
      if (option && response.label === option) {
        return { label: response.label, value: value };
      }
      return { label: response.label, value: 50 };
    });

    setResponses(updatedResponses);

    onInputChange(
      {
        [field_name_for_the_model]: updatedResponses,
      },
      metadata,
    );
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
        <div>
          <ul className="grid grid-cols-2 gap-1">
            {options.map((option, index) => {
              return (
                <li
                  className="w-full border-gray-600 rounded-t-lg"
                  key={option.label}
                >
                  <div className="flex items-center pl-3">
                    <label
                      htmlFor={`option_${index}`}
                      className="flex items-center"
                    >
                      <input
                        type="radio"
                        id={`option_${index}`}
                        name={field_name_for_the_model}
                        value={option}
                        className="mr-2"
                        onChange={() => {
                          setOptionSelectedValue(option.label);
                          setOptionSelected(true);
                          handleChange("50", option.label);
                        }}
                      />
                      {option.label}
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
          {optionSelected && (
            <div className="flex items-center justify-center px-20 pt-2">
              <div className="w-full">
                <h3 className="my-3 text-base normal-case text-letter-color">
                  {parse(instructions_slider)}
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{optionsSlider[0]}</p>
                  <p className="text-sm text-gray-600">{optionsSlider[1]}</p>
                </div>
                <input
                  type="range"
                  min={optionsSlider[0]}
                  max={optionsSlider[1]}
                  value={
                    responses.find(
                      (response) => response.label === optionSelectedValue,
                    )?.value
                  }
                  onChange={(e) => {
                    handleChange(e.target.value, optionSelectedValue);
                  }}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      </Collapse>
    </div>
  );
};

export default SelectOptionWithSlider;
