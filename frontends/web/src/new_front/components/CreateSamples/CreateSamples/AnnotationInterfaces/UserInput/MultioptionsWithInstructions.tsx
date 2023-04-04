import MultiSelectWithExtraExplanation from "new_front/components/Lists/MultiSelectWithExtraExplanation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";
import React, { FC, useContext } from "react";

const MultioptionsWithInstructions: FC<
  AnnotationFactoryType & AnnotationUserInput
> = ({ instructions, options, field_name_for_the_model }) => {
  const { updateModelInputs } = useContext(CreateInterfaceContext);

  return (
    <>
      {options && instructions && (
        <MultiSelectWithExtraExplanation
          options={options}
          instructions={instructions}
          field_name_for_the_model={field_name_for_the_model}
          onInputChange={updateModelInputs}
        />
      )}
    </>
  );
};

export default MultioptionsWithInstructions;
