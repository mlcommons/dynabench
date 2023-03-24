import RadioButton from "new_front/components/Lists/RadioButton";
import { ValidationFactoryType } from "new_front/types/createSamples/validateSamples/validationFactory";
import { ValidationUserInput } from "new_front/types/createSamples/validateSamples/validationUserInputs";
import React, { FC } from "react";

const RadioButtonOptions: FC<ValidationFactoryType & ValidationUserInput> = ({
  label,
  options,
  field_name_for_the_model,
  onInputChange,
}) => {
  return (
    <>
      {options && label && (
        <>
          <RadioButton
            options={options}
            instructions={label}
            field_name_for_the_model={field_name_for_the_model}
            onInputChange={onInputChange}
          />
        </>
      )}
    </>
  );
};

export default RadioButtonOptions;
