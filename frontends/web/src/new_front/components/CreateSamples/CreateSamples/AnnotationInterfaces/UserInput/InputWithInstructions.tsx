import BasicInput from "new_front/components/Inputs/BasicInput";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";
import React, { FC, useState } from "react";
import { Collapse } from "react-bootstrap";

const InputWithInstructions: FC<AnnotationFactoryType & AnnotationUserInput> =
  ({ onInputChange, placeholder, instructions, field_name_for_the_model }) => {
    const [open, setOpen] = useState(true);
    const handleChanges = (event: React.ChangeEvent<HTMLInputElement>) => {
      onInputChange({
        [field_name_for_the_model]: event.target.value,
      });
    };

    return (
      <div className="py-3">
        {instructions && (
          <div
            className="flex items-center h-16 px-1 space-x-10 transition cursor-pointer hover:bg-[#eef2ff]"
            onClick={() => setOpen(!open)}
          >
            <h3 className="mb-1 text-base font-semibold capitalize text-letter-color">
              {open ? (
                <i className="pl-2 pr-3 fas fa-minus" />
              ) : (
                <i className="pl-2 pr-3 fas fa-plus" />
              )}
              {instructions}
            </h3>
          </div>
        )}
        <BasicInput
          placeholder={placeholder}
          onChange={handleChanges}
          open={open}
        />
      </div>
    );
  };

export default InputWithInstructions;
