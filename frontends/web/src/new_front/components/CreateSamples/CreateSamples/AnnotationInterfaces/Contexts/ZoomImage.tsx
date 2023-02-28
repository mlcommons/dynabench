import { ContextConfigType } from "new_front/types/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/annotationFactory";
import React, { FC } from "react";
import Magnifier from "react-magnifier";

const ZoomImage: FC<ContextAnnotationFactoryType & ContextConfigType> = ({
  context,
}) => {
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
