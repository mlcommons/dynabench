import RadioButton from "new_front/components/Lists/RadioButton";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";
import React, { FC, useState } from "react";

const RadioButtonOptions: FC<AnnotationFactoryType & AnnotationUserInput> = ({
  instructions,
  options,
  field_name_for_the_model,
  onInputChange,
}) => {
  return (
    <>
      {options && instructions && (
        <>
          <RadioButton
            options={options}
            instructions={instructions}
            field_name_for_the_model={field_name_for_the_model}
            onInputChange={onInputChange}
          />
        </>
      )}
    </>
  );
};

export default RadioButtonOptions;
