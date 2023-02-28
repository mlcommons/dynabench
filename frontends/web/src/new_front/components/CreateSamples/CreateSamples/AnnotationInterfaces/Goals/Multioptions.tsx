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
      <InputGroup className="align-items-center">
        <i className="mr-1 fas fa-flag-checkered"></i>
        Your goal: enter one
        <DropdownButton variant="light" className="p-1" title={selectedOption}>
          {options
            .filter((option) => option !== selectedOption)
            .map((option, index) => (
              <Dropdown.Item
                key={index}
                onClick={() => {
                  setSelectedOption(option);
                  onInputChange({
                    [field_name_for_the_model ?? "goal_input"]: option,
                  });
                  setNoSelectedOptions(options.filter((o) => o !== option));
                }}
                name={index}
                index={index}
              >
                {option}
              </Dropdown.Item>
            ))}
        </DropdownButton>
        example that fools the model into predicting{" "}
        {noSelectedOptions.join(", ").replace(/,(?!.*,)/gim, " and")}.
      </InputGroup>
    </div>
  );
};

export default Multioptions;
