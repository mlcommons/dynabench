import MultiSelectImages from "new_front/components/Lists/MultiSelectImages";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";
import React, { FC, useContext } from "react";

const SelectMultipleImages: FC<AnnotationFactoryType & AnnotationUserInput> = ({
  instructions,
  options,
  metadata,
  field_name_for_the_model,
}) => {
  const { updateModelInputs } = useContext(CreateInterfaceContext);

  const handleFunction = (value: any) => {
    updateModelInputs(
      {
        [field_name_for_the_model]: value,
      },
      metadata
    );
  };

  return (
    <>
      {options && instructions && (
        <MultiSelectImages
          instructions={instructions}
          images={options}
          handleFunction={handleFunction}
        />
      )}
    </>
  );
};

export default SelectMultipleImages;
