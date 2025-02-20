import SimplesSliderNoExplnation from "new_front/components/Inputs/SimplesSliderNoExplnation";
import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";
import React, { FC, useContext } from "react";

const SimpleSlider: FC<AnnotationFactoryType & AnnotationUserInput> = ({
  instructions,
  field_name_for_the_model,
  instruction,
  metadata,
  options_slider,
  instructions_slider,
}) => {
  const { updateModelInputs } = useContext(CreateInterfaceContext);

  return (
    <>
      {instructions && options_slider && (
        <AnnotationInstruction placement="left" tooltip={instruction || "Rate"}>
          <SimplesSliderNoExplnation
            optionsSlider={options_slider}
            instructions_slider={instructions_slider || "Select a value"}
            instructions={instructions}
            field_name_for_the_model={field_name_for_the_model}
            metadata={metadata}
            onInputChange={updateModelInputs}
          />
        </AnnotationInstruction>
      )}
    </>
  );
};

export default SimpleSlider;
