import RadioButton from "new_front/components/Lists/RadioButton";
import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";
import React, { FC, useContext } from "react";

const RadioButtonOptions: FC<AnnotationFactoryType & AnnotationUserInput> = ({
  instructions,
  options,
  instruction,
  field_name_for_the_model,
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
            <RadioButton
              options={options}
              instructions={instructions}
              field_name_for_the_model={field_name_for_the_model}
              onInputChange={updateModelInputs}
            />
          </AnnotationInstruction>
        </>
      )}
    </>
  );
};

export default RadioButtonOptions;
