import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import React, { FC, useEffect, useContext } from "react";

const PlainText: FC<ContextAnnotationFactoryType & ContextConfigType> = ({
  context,
  metadata,
  instruction,
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

  return (
    <AnnotationInstruction
      placement="top"
      tooltip={instruction.context || "Select one of the options below"}
    >
      <div className="p-2 rounded">{context.context}</div>
    </AnnotationInstruction>
  );
};

export default PlainText;
