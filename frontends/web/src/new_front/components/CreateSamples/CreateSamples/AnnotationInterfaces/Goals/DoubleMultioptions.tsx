import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { GoalConfigType } from "new_front/types/createSamples/createSamples/annotationGoal";
import React, { FC, useEffect, useState, useContext } from "react";
import { Dropdown, DropdownButton, InputGroup } from "react-bootstrap";

const DoubleMultioptions: FC<AnnotationFactoryType & GoalConfigType> = ({
  options,
  metadata,
  instruction,
  field_name_for_the_model,
}) => {
  const [primaryOption, setPrimaryOption] = useState<string>(
    options[0].primary,
  );
  const [secondaryOptions, setSecondaryOptions] = useState<string[]>(
    options[0].secondary,
  );
  const [secondaryOption, setSecondaryOption] = useState<string>(
    options[0].secondary[0],
  );

  const { updateModelInputs } = useContext(CreateInterfaceContext);

  useEffect(() => {
    updateModelInputs(
      {
        [field_name_for_the_model + "_primary" || "goal_input"]: primaryOption,
        [field_name_for_the_model + "_secondary" || "goal_input"]:
          secondaryOption,
      },
      metadata,
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
          Select the country:
          <DropdownButton variant="light" className="p-1" title={primaryOption}>
            {options.map((option, index) => (
              <Dropdown.Item
                key={index}
                eventKey={option.primary}
                onClick={() => {
                  setPrimaryOption(option.primary);
                  setSecondaryOptions(option.secondary);
                  setSecondaryOption(option.secondary[0]);
                  updateModelInputs(
                    {
                      [field_name_for_the_model + "primary" || "goal_input"]:
                        option.primary,
                      [field_name_for_the_model + "secondary" || "goal_input"]:
                        option.secondary,
                    },
                    metadata,
                  );
                }}
              >
                {option.primary}
              </Dropdown.Item>
            ))}
          </DropdownButton>
          Now select the language:
          <DropdownButton
            variant="light"
            className="p-1"
            title={secondaryOption}
          >
            {secondaryOptions.map((option, index) => (
              <Dropdown.Item
                key={index}
                eventKey={option}
                onClick={() => {
                  setSecondaryOption(option);
                  updateModelInputs(
                    {
                      [field_name_for_the_model + "secondary" || "goal_input"]:
                        option,
                    },
                    metadata,
                  );
                }}
              >
                {option}
              </Dropdown.Item>
            ))}
          </DropdownButton>
        </InputGroup>
      </div>
    </AnnotationInstruction>
  );
};

export default DoubleMultioptions;
