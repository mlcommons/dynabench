import React, { FC, useState, useEffect } from "react";
import { Collapse } from "react-bootstrap";
import parse from "html-react-parser";

type SimpleSliderNoExplanationProps = {
  instructions: string;
  optionsSlider: string[];
  field_name_for_the_model: string;
  metadata?: boolean;
  instructions_slider: string;
  onInputChange: (data: any, metadata?: boolean) => void;
  initialOpen?: boolean;
};

const SimpleSliderNoExplanation: FC<SimpleSliderNoExplanationProps> = ({
  instructions,
  optionsSlider = ["0", "100"],
  field_name_for_the_model,
  metadata,
  instructions_slider,
  onInputChange,
  initialOpen = true,
}) => {
  const [open, setOpen] = useState(initialOpen);
  const [selectedValue, setelectedValue] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const minValue = Number(optionsSlider[0]);
  const maxValue = Number(optionsSlider[1]);

  const handleChange = (value: string) => {
    setShowTooltip(true);
    const updatedResponses = { instructions: value };

    setelectedValue(value);
    onInputChange(
      {
        [field_name_for_the_model]: updatedResponses,
      },
      metadata
    );
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;

    if (showTooltip) {
      timeout = setTimeout(() => {
        setShowTooltip(false);
      }, 1500);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [showTooltip]);

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
          <div className="w-full relative">
            <h3 className="my-3 text-base normal-case text-letter-color">
              {parse(instructions_slider)}
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">{optionsSlider[0]}</p>
              <p className="text-sm text-gray-600">{optionsSlider[1]}</p>
            </div>
            {showTooltip && (
              <div
                className={`absolute bottom-0 transform -translate-x-1/2 -translate-y-6 bg-gray-800 text-white text-sm px-2 py-1 rounded-md transition-opacity duration-1000 ${
                  showTooltip ? "opacity-0" : "opacity-100"
                }"`}
                style={{
                  left: `${
                    ((Number(selectedValue) - minValue) /
                      (maxValue - minValue)) *
                    100
                  }%`,
                }}
              >
                {selectedValue}
              </div>
            )}
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
export default SimpleSliderNoExplanation;
