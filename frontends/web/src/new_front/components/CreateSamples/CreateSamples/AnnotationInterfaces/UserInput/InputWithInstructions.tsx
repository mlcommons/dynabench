import BasicInput from "new_front/components/Inputs/BasicInput";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";
import React, { FC, useState } from "react";
import { Collapse } from "react-bootstrap";

const InputWithInstructions: FC<AnnotationFactoryType & AnnotationUserInput> =
  ({ onInputChange, placeholder, instructions, field_name_for_the_model }) => {
    const [open, setOpen] = useState(true);
    const handleChanges = (event: React.ChangeEvent<HTMLInputElement>) => {
      onInputChange({
        [field_name_for_the_model]: event.target.value,
      });
    };

    return (
      <div className="py-3">
        {instructions && (
          <h3
            className="mb-2 font-semibold text-letter-color pointer"
            onClick={() => setOpen(!open)}
          >
            {instructions} ↆ
          </h3>
        )}
        <BasicInput
          placeholder={placeholder}
          onChange={handleChanges}
          open={open}
        />
      </div>
    );
  };

export default InputWithInstructions;
