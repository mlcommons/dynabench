import React, { FC, useState } from "react";
import { Collapse } from "react-bootstrap";
import parse from "html-react-parser";

type MultiSelectWithExtraExplanationProps = {
  options: any[];
  instructions: string;
  field_name_for_the_model?: string;
  metadata?: boolean;
  onInputChange?: (data: any, metadata?: boolean) => void;
};

const MultiSelectWithExtraExplanation: FC<MultiSelectWithExtraExplanationProps> =
  ({
    options,
    instructions,
    field_name_for_the_model,
    metadata,
    onInputChange,
  }) => {
    const [selected, setSelected] = useState<string[]>([]);
    const [extraInfos, setExtraInfos] = useState<{}>(
      options
        .filter((option) => option.explanation)
        .map((option) => option.label)
        .reduce((acc, value) => ({ ...acc, [value]: "" }), {})
    );

    let finalData: any = { selected, extraInfos };

    const [open, setOpen] = useState(false);
    const handleChange = (
      event: React.ChangeEvent<HTMLInputElement>,
      option: string,
      extraInfo?: string
    ) => {
      if (extraInfo) {
        setExtraInfos({ ...extraInfos, [option]: extraInfo });
      }
      if (field_name_for_the_model && onInputChange) {
        if (event.target.checked) {
          selected.push(option);
        } else {
          const index = selected.indexOf(option);
          if (index > -1) {
            if (!extraInfo) {
              selected.splice(index, 1);
            }
            if (extraInfo && extraInfo.trim() === "") {
              setExtraInfos({ ...extraInfos, [option]: "" });
            }
          }
        }
        finalData["extraInfos"] = extraInfos;
        finalData["selected"] = selected;
        onInputChange(
          {
            [field_name_for_the_model]: finalData,
          },
          metadata
        );
      }
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
                    <input
                      id="vue-checkbox"
                      type="checkbox"
                      onChange={(event) => handleChange(event, option.label)}
                      className="bg-gray-100 border-gray-300 rounded  text-third-color focus:ring-third-color"
                    />
                    <label className="w-full pt-2 ml-2 text-base font-medium text-letter-color">
                      {parse(option.label)}
                    </label>
                    <input
                      placeholder=""
                      className={`${
                        option.explanation ? "block" : "hidden"
                      } px-2 py-1 text-base text-letter-color border border-gray-300 rounded-md w-full  `}
                      type="text"
                      onChange={(event) =>
                        handleChange(event, option.label, event.target.value)
                      }
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Collapse>
      </div>
    );
  };
export default MultiSelectWithExtraExplanation;
