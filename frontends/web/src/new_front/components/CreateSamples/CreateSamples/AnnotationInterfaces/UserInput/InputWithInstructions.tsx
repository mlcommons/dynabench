import BasicInput from "new_front/components/Inputs/BasicInput";
import { AnnotationFactoryType } from "new_front/types/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/annotationUserInputs";
import React, { FC } from "react";

const InputWithInstructions: FC<AnnotationFactoryType & AnnotationUserInput> =
  ({ onInputChange, placeholder, instructions, field_name_for_the_model }) => {
    const handleChanges = (event: React.ChangeEvent<HTMLInputElement>) => {
      onInputChange({
        [field_name_for_the_model]: event.target.value,
      });
    };

    return (
      <div className="py-3">
        {instructions && (
          <h3 className="pl-4 mb-2 font-semibold text-gray-900 ">
            {instructions}
          </h3>
        )}
        <BasicInput placeholder={placeholder} onChange={handleChanges} />
      </div>
    );
  };

export default InputWithInstructions;
