import { ContextConfigType } from "new_front/types/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/annotationFactory";
import React, { FC, useEffect, useState } from "react";
import { TokenAnnotator } from "react-text-annotate";

const PlainText: FC<ContextAnnotationFactoryType & ContextConfigType> = ({
  onInputChange,
  field_names_for_the_model,
  context,
}) => {
  useEffect(() => {
    onInputChange({
      [field_names_for_the_model.context ?? "context"]: context.context,
    });
  }, []);

  const [selectionInfo, setSelectionInfo] = useState([] as any);
  return (
    <div className="p-2 rounded">
      <TokenAnnotator
        tokens={context.context.split(" ")}
        value={selectionInfo}
        onChange={(value) => {
          setSelectionInfo(value);
          onInputChange({
            [field_names_for_the_model.answer ?? "selectable_text"]:
              context.context
                .split(" ")
                .slice(value[0].start, value[0].end)
                .join(" "),
          });
        }}
      />
    </div>
  );
};

export default PlainText;
