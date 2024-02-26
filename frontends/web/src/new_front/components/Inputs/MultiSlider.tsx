import parse from "html-react-parser";
import React, { FC, useState } from "react";
import { Collapse } from "react-bootstrap";

type MultiSliderProps = {
  options: any[];
  instructions: string;
  optionsSlider: string[];
  field_name_for_the_model: string;
  metadata?: boolean;
  onInputChange: (data: any, metadata?: boolean) => void;
};

const MultiSlider: FC<MultiSliderProps> = ({
  options,
  instructions,
  optionsSlider = ["0", "100"],
  field_name_for_the_model,
  metadata,
  onInputChange,
}) => {
  const [open, setOpen] = useState(false);
  const [responses, setResponses] = useState<any[]>(
    options.map((option) => {
      return { label: option.label, value: 50 };
    }),
  );

  const handleChange = (option: string, value: string) => {
    const updatedResponses = [...responses];
    const responseIndex = updatedResponses.findIndex(
      (response) => response.label === option,
    );
    if (responseIndex !== -1) {
      updatedResponses[responseIndex].value = value;
    }
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
        <ul className="w-full text-sm font-medium text-letter-color ">
          {options.map((option, index) => {
            return (
              <li className="w-full border-gray-600 rounded-t-lg" key={index}>
                <div className="flex items-center pl-3">
                  {option.label && (
                    <label className="w-full pt-2 ml-2 text-base font-medium text-letter-color">
                      {parse(option.label)}
                    </label>
                  )}
                  <div className="flex items-center justify-between w-full gap-2 px-4 pt-4 pb-2 border-t">
                    <span className="text-gray-500 ">{optionsSlider[0]}</span>
                    <input
                      className={`rounded-full w-full cursor-pointer `}
                      type="range"
                      step={1}
                      defaultValue={50}
                      min={1}
                      max={100}
                      onChange={(event) =>
                        handleChange(option.label, event.target.value)
                      }
                    />
                    <span className="text-gray-500 ">{optionsSlider[1]}</span>
                    <input
                      className="w-10 text-center text-gray-500 bg-gray-100 border-gray-300 rounded"
                      type="checkbox"
                      value="N/A"
                      onChange={(event) =>
                        handleChange(option.label, event.target.value)
                      }
                    />
                    <span className="text-gray-500 ">N/A</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Collapse>
    </div>
  );
};

export default MultiSlider;
