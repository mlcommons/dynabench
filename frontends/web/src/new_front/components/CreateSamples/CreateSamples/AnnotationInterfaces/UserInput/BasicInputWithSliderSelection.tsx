import BasicInputWithSlider from "new_front/components/Inputs/BasicInputWithSlider";
import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";
import React, { FC, useContext } from "react";

const BasicInputWithSliderSelection: FC<
  AnnotationFactoryType & AnnotationUserInput
> = ({
  instructions,
  options,
  field_name_for_the_model,
  instruction,
  metadata,
  options_slider,
  instructions_slider,
}) => {
  const { updateModelInputs } = useContext(CreateInterfaceContext);
  return (
    <>
      {options && instructions && (
        <AnnotationInstruction
          placement="left"
          tooltip={instruction || "Select one of the options below"}
        >
          <BasicInputWithSlider
            options={options}
            instructions={instructions}
            optionsSlider={options_slider}
            field_name_for_the_model={field_name_for_the_model}
            metadata={metadata}
            instructions_slider={instructions_slider || "Select a value"}
            onInputChange={updateModelInputs}
          />
        </AnnotationInstruction>
      )}
    </>
  );
};

export default BasicInputWithSliderSelection;
