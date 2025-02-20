import HorizontalRadioButton from "new_front/components/Lists/HorizontalRadioButton";
import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";
import React, { FC, useContext } from "react";

const HorizontalRadioButtonOptions: FC<
  AnnotationFactoryType & AnnotationUserInput
> = ({
  instructions,
  options,
  instruction,
  field_name_for_the_model,
  initiate_open,
}) => {
  const { updateModelInputs } = useContext(CreateInterfaceContext);

  return (
    <>
      {options && instructions && (
        <>
          <AnnotationInstruction
            placement="left"
            tooltip={instruction || "Select one of the options below"}
          >
            <HorizontalRadioButton
              options={options}
              instructions={instructions}
              field_name_for_the_model={field_name_for_the_model}
              onInputChange={updateModelInputs}
              InitialOpen={initiate_open}
            />
          </AnnotationInstruction>
        </>
      )}
    </>
  );
};

export default HorizontalRadioButtonOptions;
