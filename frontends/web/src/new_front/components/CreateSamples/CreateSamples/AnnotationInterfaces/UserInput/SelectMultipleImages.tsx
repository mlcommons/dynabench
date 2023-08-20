import MultiSelectImages from "new_front/components/Lists/MultiSelectImages";
import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";
import React, { FC, useContext } from "react";

const SelectMultipleImages: FC<AnnotationFactoryType & AnnotationUserInput> = ({
  instructions,
  options,
  metadata,
  instruction,
  field_name_for_the_model,
}) => {
  const { updateModelInputs } = useContext(CreateInterfaceContext);

  const handleFunction = (value: any) => {
    updateModelInputs(
      {
        [field_name_for_the_model]: value,
      },
      metadata,
    );
  };

  return (
    <>
      {options && instructions && (
        <AnnotationInstruction
          placement="left"
          tooltip={instruction || "Select one of the options below"}
        >
          <MultiSelectImages
            instructions={instructions}
            images={options}
            handleFunction={handleFunction}
          />
        </AnnotationInstruction>
      )}
    </>
  );
};

export default SelectMultipleImages;
