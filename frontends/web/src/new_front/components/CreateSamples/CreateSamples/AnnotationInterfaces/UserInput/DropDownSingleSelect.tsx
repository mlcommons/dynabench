import DropDownWithInstructions from "new_front/components/Lists/DropnDownWithInstructions";
import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";
import React, { FC, useContext } from "react";

const DropDownSingleSelect: FC<AnnotationFactoryType & AnnotationUserInput> = ({
  instructions,
  options,
  field_name_for_the_model,
  instruction,
  metadata,
  initiate_open,
}) => {
  const { updateModelInputs } = useContext(CreateInterfaceContext);

  return (
    <>
      {options && instructions && (
        <AnnotationInstruction
          placement="left"
          tooltip={instruction || "Select one of the options below"}
        >
          <DropDownWithInstructions
            options={options}
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

export default DropDownSingleSelect;
