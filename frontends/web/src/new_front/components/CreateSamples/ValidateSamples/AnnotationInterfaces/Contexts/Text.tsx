import { ValidationContext } from "new_front/types/createSamples/validateSamples/validationContext";
import { ValidationFactoryType } from "new_front/types/createSamples/validateSamples/validationFactory";
import React, { FC } from "react";

const Text: FC<ValidationFactoryType & ValidationContext> = ({
  label,
  info,
}) => {
  return (
    <>
      {info && (
        <div className="py-1">
          <div className="text-base text-[#005798] font-bold normal-case ">
            {label!.replace("_", " ")}
          </div>
          <div className="text-base text-gray-500">{info}</div>
        </div>
      )}
    </>
  );
};

export default Text;
