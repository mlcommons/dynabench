import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import React, { FC, useContext, useState } from "react";

type EvaluateTextProps = {
  text: string;
  id: string;
  texts: any;
  setTexts: any;
  name?: string;
  optionsSlider?: string[];
  disabled?: boolean;
  bestAnswer?: string;
};

const EvaluateText: FC<EvaluateTextProps> = ({
  text,
  id,
  texts,
  setTexts,
  optionsSlider = ["0", "100"],
  disabled = false,
  bestAnswer = "",
}) => {
  const handleUpdateScore = (event: any) => {
    setTexts(
      texts.map((text: any) => {
        if (text.id === id) {
          return {
            ...text,
            score: parseInt(event.target.value),
          };
        }
        return text;
      }),
    );
  };

  return (
    <form id={id}>
      <div className="w-full mb-4 border border-gray-200 rounded-lg bg-gray-50 ">
        <div className=" bg-white rounded-t-lg text-black">
          <textarea
            id="comment"
            className={`${
              bestAnswer === text
                ? "bg-primary-color font-bold"
                : "bg-white font-semibold"
            } w-full h-32 pl-1 border-0 px-2 py-2  text-letter-color `}
            placeholder={text}
            required
            disabled={disabled}
          ></textarea>
        </div>
        <div className="flex items-center justify-between w-full gap-2 pt-4 border-t px-4 pb-2">
          <span className="text-gray-500 ">{optionsSlider[0]}</span>
          <input
            id={id}
            className={`rounded-full w-full cursor-pointer `}
            type="range"
            step={1}
            defaultValue={50}
            min={1}
            max={100}
            onChange={handleUpdateScore}
            disabled={disabled}
          />
          <span className=" text-gray-500 ">{optionsSlider[1]}</span>
        </div>
        <div className="flex justify-between w-full"></div>
      </div>
    </form>
  );
};

export default EvaluateText;
