import MultiSelect from "new_front/components/Lists/MultiSelect";
import { ValidationFactoryType } from "new_front/types/createSamples/validateSamples/validationFactory";
import { ValidationUserInput } from "new_front/types/createSamples/validateSamples/validationUserInputs";
import React, { FC } from "react";

const Multioptions: FC<ValidationFactoryType & ValidationUserInput> = ({
  label,
  options,
  field_name_for_the_model,
  onInputChange,
}) => {
  return (
    <>
      {options && label && (
        <MultiSelect
          options={options}
          instructions={label}
          field_name_for_the_model={field_name_for_the_model}
          onInputChange={onInputChange}
        />
      )}
    </>
  );
};

export default Multioptions;
