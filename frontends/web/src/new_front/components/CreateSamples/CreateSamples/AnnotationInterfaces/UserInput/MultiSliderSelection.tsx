import React, { FC, useContext } from "react";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import MultiSlider from "new_front/components/Inputs/MultiSlider";

const MultiSliderSelection: FC<AnnotationFactoryType & AnnotationUserInput> = ({
  instructions,
  options,
  field_name_for_the_model,
  instruction,
  metadata,
}) => {
  const { updateModelInputs } = useContext(CreateInterfaceContext);

  return (
    <>
      {options && instructions && (
        <AnnotationInstruction
          placement="left"
          tooltip={instruction || "Select one of the options below"}
        >
          <MultiSlider
            options={options}
            instructions={instructions}
            optionsSlider={["0", "100"]}
            field_name_for_the_model={field_name_for_the_model}
            metadata={metadata}
            onInputChange={updateModelInputs}
          />
        </AnnotationInstruction>
      )}
    </>
  );
};

export default MultiSliderSelection;
