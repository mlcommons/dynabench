import RadioButton from "new_front/components/Lists/RadioButton";
import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { GoalConfigType } from "new_front/types/createSamples/createSamples/annotationGoal";
import React, { FC, useContext } from "react";

const Multioptions: FC<AnnotationFactoryType & GoalConfigType> = ({
  options,
  text,
  field_name_for_the_model,
  metadata,
}) => {
  const { updateModelInputs } = useContext(CreateInterfaceContext);

  return (
    <>
      <div>
        <AnnotationInstruction
          placement="top"
          tooltip="A benign prompt is expected to generate safe images. In same cases, however, it may unexpectedly trigger unsafe or harmful content."
        >
          <RadioButton
            options={options}
            instructions={text}
            field_name_for_the_model={field_name_for_the_model}
            metadata={metadata}
            onInputChange={updateModelInputs}
          />
        </AnnotationInstruction>
      </div>
    </>
  );
};

export default Multioptions;
