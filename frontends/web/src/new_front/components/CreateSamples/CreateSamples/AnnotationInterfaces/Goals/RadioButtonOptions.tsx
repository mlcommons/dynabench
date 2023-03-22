import React, { FC, useEffect, useState } from "react";
import { InputGroup, DropdownButton, Dropdown } from "react-bootstrap";
import { GoalConfigType } from "new_front/types/createSamples/createSamples/annotationGoal";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import RadioButton from "new_front/components/Lists/RadioButton";
import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";

const Multioptions: FC<AnnotationFactoryType & GoalConfigType> = ({
  options,
  text,
  field_name_for_the_model,
  onInputChange,
}) => {
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
            onInputChange={onInputChange}
          />
        </AnnotationInstruction>
      </div>
    </>
  );
};

export default Multioptions;
