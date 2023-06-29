import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import React, { FC, useContext, useState } from "react";

type EvaluateTextProps = {
  text: string;
  id: string;
  texts: any;
  setTexts: any;
  name?: string;
};

const EvaluateText: FC<EvaluateTextProps> = ({
  text,
  id,
  name,
  texts,
  setTexts,
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
      })
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
            className="w-full h-32 px-0 font-medium text-black bg-white border-0"
            placeholder={text}
            required
            disabled
          ></textarea>
        </div>
        <div className="flex items-center justify-between w-full px-3 pt-4 border-t ">
          <div className="relative ">
            <div className="px-4 py-1 -mt-8 truncate rounded bg-gray-50 text-letter">
              {score}
            </div>
            <svg
              className="absolute left-0 w-full h-2 text-letter top-100"
              x="0px"
              y="0px"
              viewBox="0 0 20 20"
            >
              <polygon
                className="fill-current"
                points="5,0 20,10 5,20"
                fill="black"
              ></polygon>
            </svg>
          </div>
          <input
            id={id}
            className={`rounded-full w-full cursor-pointer ${
              score < 33
                ? "accent-red-500"
                : score < 66
                ? "accent-yellow-500"
                : "accent-green-500"
            }`}
            type="range"
            step={1}
            defaultValue={50}
            min={1}
            max={100}
            onChange={handleUpdateScore}
          />
        </div>

        <div className="flex justify-between w-full">
          <span className="pl-20 text-gray-500 ">0</span>
          <span className="pr-3 text-gray-500 ">100</span>
        </div>
      </div>
    </form>
  );
};

export default EvaluateText;
