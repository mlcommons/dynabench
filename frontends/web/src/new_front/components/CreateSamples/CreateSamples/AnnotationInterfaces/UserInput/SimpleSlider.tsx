import SimpleSliderNoExplanation from "new_front/components/Inputs/SimpleSliderNoExplanation";
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
  initiate_open,
}) => {
  const { updateModelInputs } = useContext(CreateInterfaceContext);

  return (
    <>
      {instructions && options_slider && (
        <AnnotationInstruction placement="left" tooltip={instruction || "Rate"}>
          <SimpleSliderNoExplanation
            optionsSlider={options_slider}
            instructions_slider={instructions_slider || "Select a value"}
            instructions={instructions}
            field_name_for_the_model={field_name_for_the_model}
            metadata={metadata}
            onInputChange={updateModelInputs}
            initialOpen={initiate_open}
          />
        </AnnotationInstruction>
      )}
    </>
  );
};

export default SimpleSlider;
