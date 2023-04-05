import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import React, { FC, useContext, useEffect } from "react";
import Magnifier from "react-magnifier";

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
      <Magnifier
        mgWidth={250}
        mgHeight={250}
        width={640}
        height={480}
        src={context}
        mgShape={"square"}
      />
    </div>
  );
};

export default ZoomImage;
