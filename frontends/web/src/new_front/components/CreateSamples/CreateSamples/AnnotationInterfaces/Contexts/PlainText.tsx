import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import React, { FC, useEffect, useContext } from "react";

const PlainText: FC<ContextAnnotationFactoryType & ContextConfigType> = ({
  context,
  metadata,
  field_names_for_the_model,
}) => {
  const { updateModelInputs } = useContext(CreateInterfaceContext);

  useEffect(() => {
    updateModelInputs(
      {
        [field_names_for_the_model.context]: context.context,
      },
      metadata
    );
  }, []);

  return <div className="p-2 rounded">{context.context}</div>;
};

export default PlainText;
