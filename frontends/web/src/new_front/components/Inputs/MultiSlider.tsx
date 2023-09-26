import React, { FC, useState } from "react";
import { Collapse } from "react-bootstrap";
import parse from "html-react-parser";

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
  const [responses, setResponses] = useState<any[]>([]);
  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    option: string,
    extraInfo?: string,
  ) => {
    const newResponses = responses.map((response) => {
      if (response.option === option) {
        return {
          ...response,
          value: parseInt(event.target.value),
        };
      }
      return response;
    });
    setResponses(newResponses);
    onInputChange({
      [field_name_for_the_model]: responses,
      extraInfo,
    });
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
                  <label className="w-full pt-2 ml-2 text-base font-medium text-letter-color">
                    {parse(option.label)}
                  </label>
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
                        handleChange(event, option.label, event.target.value)
                      }
                    />
                    <span className="text-gray-500 ">{optionsSlider[1]}</span>
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
