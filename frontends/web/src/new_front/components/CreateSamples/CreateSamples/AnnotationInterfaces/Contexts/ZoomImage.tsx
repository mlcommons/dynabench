import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import React, { FC, useContext, useEffect } from "react";
import Zoom from "react-medium-image-zoom";

const ZoomImage: FC<ContextAnnotationFactoryType & ContextConfigType> = ({
  context,
  field_names_for_the_model,
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
    <div className="flex items-center justify-center">
      <Zoom>
        <img
          alt="That Wanaka Tree, New Zealand by Laura Smetsers"
          src={context.context}
          width="500"
        />
      </Zoom>
    </div>
  );
};

export default ZoomImage;
