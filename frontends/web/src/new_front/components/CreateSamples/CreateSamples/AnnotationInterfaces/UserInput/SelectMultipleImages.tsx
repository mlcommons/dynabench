import MultiSelectImages from "new_front/components/Lists/MultiSelectImages";
import { AnnotationFactoryType } from "new_front/types/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/annotationUserInputs";
import React, { FC } from "react";

const SelectMultipleImages: FC<AnnotationFactoryType & AnnotationUserInput> = ({
  instructions,
  options,
  field_name_for_the_model,
  onInputChange,
}) => {
  const handleFunction = (value: any) => {
    onInputChange({
      [field_name_for_the_model]: value,
    });
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
