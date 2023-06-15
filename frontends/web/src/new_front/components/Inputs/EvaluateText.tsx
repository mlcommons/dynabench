import React, { FC, useState } from "react";

type EvaluateTextProps = {
  text: string;
  id: string;
};

const EvaluateText: FC<EvaluateTextProps> = ({ text, id }) => {
  const [score, setScore] = useState<number>(50);

  const handleRangeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setScore(parseInt(event.target.value));
  };

  return (
    <form>
      <div className="w-full mb-4 border border-gray-200 rounded-lg bg-gray-50 ">
        <div className="px-4 py-2 bg-white rounded-t-lg ">
          <textarea
            id="comment"
            className="w-full px-0 text-letter-color bg-white border-0 h-32"
            placeholder={text}
            required
          ></textarea>
        </div>
        <div className="flex items-center w-full justify-between px-3 pt-4  border-t ">
          <div className="relative ">
            <div className="bg-gray-50 -mt-8 text-letter truncate rounded py-1 px-4">
              {score}
            </div>
            <svg
              className="absolute text-letter w-full h-2 left-0 top-100"
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
            onChange={handleRangeChange}
          />
        </div>

        <div className="flex justify-between w-full">
          <span className=" text-gray-500 pl-20">0</span>
          <span className=" text-gray-500 pr-3">100</span>
        </div>
      </div>
    </form>
  );
};

export default EvaluateText;
