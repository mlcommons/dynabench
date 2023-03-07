import { AnnotationFactoryType } from "new_front/types/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/annotationUserInputs";

import React, { FC } from "react";
import { FormControl } from "react-bootstrap";

const Text: FC<AnnotationFactoryType & AnnotationUserInput> = ({
  onInputChange,
  placeholder,
  field_name_for_the_model,
}) => {
  return (
    <div className="py-1">
      <FormControl
        className="p-3 h-12 rounded-1 thick-border bg-[#f0f2f5]"
        onChange={(event) => {
          onInputChange({
            [field_name_for_the_model ?? "goal_input"]: event.target.value,
          });
        }}
        placeholder={placeholder}
        required={true}
      />
    </div>
  );
};

export default Text;
