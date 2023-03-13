import React, { FC, useEffect, useState } from "react";
import { InputGroup, DropdownButton, Dropdown } from "react-bootstrap";
import { GoalConfigType } from "new_front/types/createSamples/annotationGoal";
import { AnnotationFactoryType } from "new_front/types/createSamples/annotationFactory";

const Multioptions: FC<AnnotationFactoryType & GoalConfigType> = ({
  onInputChange,
  options,
  field_name_for_the_model,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>(options[0]);
  const [noSelectedOptions, setNoSelectedOptions] = useState<string[]>(
    options.slice(1)
  );

  useEffect(() => {
    onInputChange({
      [field_name_for_the_model ?? "goal_input"]: selectedOption,
    });
  }, []);

  return (
    <div className="p-3 border rounded bg-[#f0f2f5]">
      <i className="mr-1 fas fa-flag-checkered"></i>
      Select what type of example you want to create:
      <InputGroup className="align-items-center">
        {options.map((option, index) => (
          <>
            <div className="flex items-center mb-4">
              <input
                id="country-option-1"
                type="radio"
                name="countries"
                value="USA"
                className="w-4 h-4 border-gray-300 focus:ring-2 focus:ring-blue-300"
                aria-labelledby="country-option-1"
                aria-describedby="country-option-1"
              />
              <label className="block ml-2 text-sm font-medium text-gray-900">
                {option}
              </label>
            </div>
          </>
        ))}
      </InputGroup>
    </div>
  );
};

export default Multioptions;
