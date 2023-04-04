import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import React, { FC, useEffect, useState, useContext } from "react";
import { TokenAnnotator } from "react-text-annotate";

const PlainText: FC<ContextAnnotationFactoryType & ContextConfigType> = ({
  field_names_for_the_model,
  context,
  metadata,
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

  const [selectionInfo, setSelectionInfo] = useState([] as any);
  return (
    <div className="p-2 rounded">
      <TokenAnnotator
        tokens={context.context.split(" ")}
        value={selectionInfo}
        onChange={(value) => {
          setSelectionInfo(value);
          updateModelInputs(
            {
              [field_names_for_the_model.answer ?? "selectable_text"]:
                context.context
                  .split(" ")
                  .slice(value[0].start, value[0].end)
                  .join(" "),
            },
            metadata
          );
        }}
      />
    </div>
  );
};

export default PlainText;
