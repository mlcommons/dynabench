import MultiSelect from "new_front/components/Lists/MultiSelect";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";
import React, { FC } from "react";

const Multioptions: FC<AnnotationFactoryType & AnnotationUserInput> = ({
  instructions,
  options,
  field_name_for_the_model,
  onInputChange,
}) => {
  return (
    <>
      {options && instructions && (
        <MultiSelect
          options={options}
          instructions={instructions}
          field_name_for_the_model={field_name_for_the_model}
          onInputChange={onInputChange}
        />
      )}
    </>
  );
};

export default Multioptions;
