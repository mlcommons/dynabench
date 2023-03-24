import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import React, { FC, useEffect } from "react";

const PlainText: FC<ContextAnnotationFactoryType & ContextConfigType> = ({
  context,
  field_names_for_the_model,
  onInputChange,
}) => {
  useEffect(() => {
    onInputChange({
      [field_names_for_the_model.context]: context.context,
    });
  }, []);

  return <div className="p-2 rounded">{context.context}</div>;
};

export default PlainText;
