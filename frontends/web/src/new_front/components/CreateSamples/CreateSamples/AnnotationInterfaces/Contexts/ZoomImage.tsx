import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import React, { FC, useContext, useEffect } from "react";
import Zoom from "react-medium-image-zoom";

const ZoomImage: FC<ContextAnnotationFactoryType & ContextConfigType> = ({
  context,
  field_names_for_the_model,
  instruction,
  metadata,
}) => {
  const { updateModelInputs } = useContext(CreateInterfaceContext);

  useEffect(() => {
    updateModelInputs(
      {
        [field_names_for_the_model.context]: context.context,
      },
      metadata?.context
    );
  }, []);

  return (
    <AnnotationInstruction
      placement="top"
      tooltip={instruction.context || "Select one of the options below"}
    >
      <div className="flex items-center justify-center">
        <Zoom>
          <img
            alt="That Wanaka Tree, New Zealand by Laura Smetsers"
            src={context.context}
            width="500"
          />
        </Zoom>
      </div>
    </AnnotationInstruction>
  );
};

export default ZoomImage;
