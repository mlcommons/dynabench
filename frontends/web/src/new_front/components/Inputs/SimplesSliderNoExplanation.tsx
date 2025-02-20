import React, { FC, useState } from "react";
import { Collapse } from "react-bootstrap";
import parse from "html-react-parser";

type SimplesSliderNoExplnationProps = {
  instructions: string;
  optionsSlider: string[];
  field_name_for_the_model: string;
  metadata?: boolean;
  instructions_slider: string;
  onInputChange: (data: any, metadata?: boolean) => void;
};

const SimplesSliderNoExplnation: FC<SimplesSliderNoExplnationProps> = ({
  instructions,
  optionsSlider = ["0", "100"],
  field_name_for_the_model,
  metadata,
  instructions_slider,
  onInputChange,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedValue, setelectedValue] = useState("");

  const handleChange = (value: string) => {
    const updatedResponses = { instructions: value };

    setelectedValue(value);

    onInputChange(
      {
        [field_name_for_the_model]: updatedResponses,
      },
      metadata
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
              value={selectedValue}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </Collapse>
    </div>
  );
};
export default SimplesSliderNoExplnation;
