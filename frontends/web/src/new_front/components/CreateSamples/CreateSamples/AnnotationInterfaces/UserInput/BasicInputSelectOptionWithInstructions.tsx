import BasicInputSelectOption from "new_front/components/Inputs/BasicInputSelectOption";
import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";
import React, { FC, useState, useContext } from "react";
import parse from "html-react-parser";

const BasicInputSelectOptionWithInstructions: FC<
  AnnotationFactoryType & AnnotationUserInput
> = ({
  placeholder,
  instructions,
  field_name_for_the_model,
  instruction,
  metadata,
  options,
}) => {
  const [open, setOpen] = useState(false);
  const { updateModelInputs } = useContext(CreateInterfaceContext);

  const handleChanges = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateModelInputs(
      {
        [field_name_for_the_model]: event.target.value,
      },
      metadata,
    );
  };
  return (
    <AnnotationInstruction
      placement="left"
      tooltip={instruction || "Select one of the options below"}
    >
      <div className="flex flex-col gap-16 py-3">
        {instructions && (
          <div
            className="flex items-center gap-8 h-16 px-1 space-x-10 transition cursor-pointer hover:bg-[#eef2ff]"
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
        <BasicInputSelectOption
          placeholder={placeholder}
          onChange={handleChanges}
          open={open}
          options={options || []}
        />
      </div>
    </AnnotationInstruction>
  );
};

export default BasicInputSelectOptionWithInstructions;
