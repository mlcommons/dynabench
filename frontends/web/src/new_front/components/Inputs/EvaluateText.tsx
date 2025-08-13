import React, { FC, useEffect } from "react";
import GeneralButton from "new_front/components/Buttons/GeneralButton";

type EvaluateTextProps = {
  text: string;
  id: string;
  texts: any;
  setTexts: any;
  name?: string;
  optionsSlider?: string[];
  disabled?: boolean;
  bestAnswer?: string;
  score?: number;
  handleWhenButtons?: any;
};

const EvaluateText: FC<EvaluateTextProps> = ({
  text,
  id,
  texts,
  setTexts,
  optionsSlider,
  disabled = false,
  bestAnswer,
  score = 50,
  handleWhenButtons,
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
      })
    );
  };

  const handleOnClick = (id: string) => {
    setTexts(
      texts.map((text: any) => {
        if (text.id === id) {
          return {
            ...text,
            score: 100,
          };
        } else {
          return {
            ...text,
            score: 0,
          };
        }
      })
    );
    handleWhenButtons("top");
  };

  return (
    <form id={id}>
      <div className="w-full mb-4 border border-gray-200 rounded-lg bg-gray-50 ">
        <div className="text-black bg-white rounded-t-lg ">
          <textarea
            id="comment"
            className={`${
              bestAnswer === text
                ? "bg-primary-color font-bold"
                : "bg-white font-semibold"
            } w-full pl-1 border-0 px-2 py-2  text-letter-color `}
            placeholder={text}
            required
            disabled={true}
            rows={7}
          />
        </div>
        {optionsSlider && (
          <div className="flex items-center justify-between w-full gap-2 px-4 pt-4 pb-2 border-t">
            <span className="text-gray-500 ">{optionsSlider[0]}</span>
            <input
              id={id}
              className={`rounded-full w-full cursor-pointer `}
              type="range"
              step={1}
              defaultValue={score}
              min={1}
              max={100}
              onChange={handleUpdateScore}
              disabled={disabled}
            />
            <span className="text-gray-500 ">{optionsSlider[1]}</span>
          </div>
        )}

        {!optionsSlider && (
          <div className="flex items-center justify-end w-full gap-2 px-4 pt-4 pb-2 border-t">
            <span className="text-gray-500 ">Option # {id + 1}</span>
            <GeneralButton
              key={id}
              onClick={() => handleOnClick(id)}
              text={"Top Answer 👍👍"}
              className="border-0 font-weight-bold light-gray-bg task-action-btn"
              active={score === 100}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </form>
  );
};

export default EvaluateText;
