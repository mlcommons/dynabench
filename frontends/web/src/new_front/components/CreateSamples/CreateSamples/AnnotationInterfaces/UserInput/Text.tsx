import BasicInput from "new_front/components/Inputs/BasicInput";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";
import React, { FC } from "react";

const Text: FC<AnnotationFactoryType & AnnotationUserInput> = ({
  onInputChange,
  placeholder,
  field_name_for_the_model,
}) => {
  const handleChanges = (event: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange({
      [field_name_for_the_model]: event.target.value,
    });
  };
  return (
    <div className="py-1">
      <BasicInput placeholder={placeholder} onChange={handleChanges} />
    </div>
  );
};

export default Text;
