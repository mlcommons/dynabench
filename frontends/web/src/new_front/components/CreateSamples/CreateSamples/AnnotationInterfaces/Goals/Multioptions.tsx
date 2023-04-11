import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { GoalConfigType } from "new_front/types/createSamples/createSamples/annotationGoal";
import React, { FC, useEffect, useState, useContext } from "react";
import { Dropdown, DropdownButton, InputGroup } from "react-bootstrap";

const Multioptions: FC<AnnotationFactoryType & GoalConfigType> = ({
  options,
  metadata,
  instruction,
  field_name_for_the_model,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>(options[0]);
  const [noSelectedOptions, setNoSelectedOptions] = useState<string[]>(
    options.slice(1)
  );
  const { updateModelInputs } = useContext(CreateInterfaceContext);

  useEffect(() => {
    updateModelInputs(
      {
        [field_name_for_the_model ?? "goal_input"]: selectedOption,
      },
      metadata
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnnotationInstruction
      placement="top"
      tooltip={instruction || "Select one of the options below"}
    >
      <div className="p-3 border rounded bg-[#f0f2f5]">
        <InputGroup className="align-items-center">
          <i className="mr-1 fas fa-flag-checkered"></i>
          Your goal: enter one
          <DropdownButton
            variant="light"
            className="p-1"
            title={selectedOption}
          >
            {options
              .filter((option) => option !== selectedOption)
              .map((option, index) => (
                <Dropdown.Item
                  key={index}
                  onClick={() => {
                    setSelectedOption(option);
                    updateModelInputs(
                      {
                        [field_name_for_the_model ?? "goal_input"]: option,
                      },
                      metadata
                    );
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
    </AnnotationInstruction>
  );
};

export default Multioptions;
