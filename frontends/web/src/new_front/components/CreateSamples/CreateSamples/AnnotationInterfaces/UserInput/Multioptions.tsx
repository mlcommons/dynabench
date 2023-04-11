import MultiSelect from "new_front/components/Lists/MultiSelect";
import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";
import React, { FC, useContext } from "react";

const Multioptions: FC<AnnotationFactoryType & AnnotationUserInput> = ({
  instructions,
  options,
  metadata,
  instruction,
  field_name_for_the_model,
}) => {
  const { updateModelInputs } = useContext(CreateInterfaceContext);

  return (
    <>
      {options && instructions && (
        <AnnotationInstruction
          placement="top"
          tooltip={instruction || "Select one of the options below"}
        >
          <MultiSelect
            options={options}
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

export default Multioptions;
