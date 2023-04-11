import BasicInput from "new_front/components/Inputs/BasicInput";
import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";
import React, { FC, useState, useContext } from "react";
import parse from "html-react-parser";

const InputWithInstructions: FC<AnnotationFactoryType & AnnotationUserInput> =
  ({
    placeholder,
    instructions,
    field_name_for_the_model,
    instruction,
    metadata,
  }) => {
    const [open, setOpen] = useState(true);
    const { updateModelInputs } = useContext(CreateInterfaceContext);

    const handleChanges = (event: React.ChangeEvent<HTMLInputElement>) => {
      updateModelInputs(
        {
          [field_name_for_the_model]: event.target.value,
        },
        metadata
      );
    };

    return (
      <AnnotationInstruction
        placement="top"
        tooltip={instruction || "Select one of the options below"}
      >
        <div className="py-3">
          {instructions && (
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
          )}
          <BasicInput
            placeholder={placeholder}
            onChange={handleChanges}
            open={open}
          />
        </div>
      </AnnotationInstruction>
    );
  };

export default InputWithInstructions;
