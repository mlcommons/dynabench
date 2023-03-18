import React, { FC, useEffect, useState } from "react";
import { InputGroup, DropdownButton, Dropdown } from "react-bootstrap";
import { GoalConfigType } from "new_front/types/createSamples/annotationGoal";
import { AnnotationFactoryType } from "new_front/types/createSamples/annotationFactory";
import RadioButton from "new_front/components/Lists/RadioButton";

const Multioptions: FC<AnnotationFactoryType & GoalConfigType> = ({
  options,
  text,
  field_name_for_the_model,
  onInputChange,
}) => {
  return (
    <>
      <div className="light-gray-bg">
        <RadioButton
          options={options}
          instructions={text}
          field_name_for_the_model={field_name_for_the_model}
          onInputChange={onInputChange}
        />
      </div>
    </>
  );
};

export default Multioptions;
