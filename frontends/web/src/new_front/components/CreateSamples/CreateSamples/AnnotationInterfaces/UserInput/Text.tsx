import BasicInput from "new_front/components/Inputs/BasicInput";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";
import React, { FC, useContext } from "react";

const Text: FC<AnnotationFactoryType & AnnotationUserInput> = ({
  placeholder,
  field_name_for_the_model,
}) => {
  const { updateModelInputs } = useContext(CreateInterfaceContext);

  const handleChanges = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateModelInputs({
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
