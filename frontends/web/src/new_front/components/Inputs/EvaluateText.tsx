import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import React, { FC, useContext, useState } from "react";

type EvaluateTextProps = {
  text: string;
  id: string;
  texts: any;
  setTexts: any;
  name?: string;
  options_slider?: string[];
};

const EvaluateText: FC<EvaluateTextProps> = ({
  text,
  id,
  name,
  texts,
  setTexts,
  options_slider = ["0", "100"],
}) => {
  const [score, setScore] = useState<number>(50);

  const handleUpdateScore = (event: any) => {
    setScore(parseInt(event.target.value));
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
      <label
        htmlFor="comment"
        className="block pl-1 text-lg font-medium text-letter-color"
      >
        {name}
      </label>
      <div className="w-full mb-4 border border-gray-200 rounded-lg bg-gray-50 ">
        <div className="px-2 py-2 bg-white rounded-t-lg ">
          <textarea
            id="comment"
            className="w-full h-32 pl-1 font-medium text-black bg-white border-0"
            placeholder={text}
            required
            disabled
          ></textarea>
        </div>
        <div className="flex items-center justify-between w-full gap-2 pt-4 border-t px-4 pb-2">
          <span className="text-gray-500 ">{options_slider[0]}</span>
          <input
            id={id}
            className={`rounded-full w-full cursor-pointer `}
            type="range"
            step={1}
            defaultValue={50}
            min={1}
            max={100}
            onChange={handleUpdateScore}
          />

          <span className=" text-gray-500 ">{options_slider[1]}</span>
        </div>

        <div className="flex justify-between w-full"></div>
      </div>
    </form>
  );
};

export default EvaluateText;
