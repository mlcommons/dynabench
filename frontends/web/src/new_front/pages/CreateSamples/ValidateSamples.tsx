import CreateInterfaceHelpersButton from "new_front/components/Buttons/CreateInterfaceHelpersButton";
import AnnotationTitle from "new_front/components/CreateSamples/CreateSamples/AnnotationTitle";
import ValidationContextStrategy from "new_front/components/CreateSamples/ValidateSamples/AnnotationInterfaces/Contexts/ValidationContextStrategy";
import ValidationUserInputStrategy from "new_front/components/CreateSamples/ValidateSamples/AnnotationInterfaces/UserInput/ValidationUserInputStrategy";
import React, { FC, useContext, useState } from "react";
import { OverlayContext } from "new_front/components/OverlayInstructions/Provider";
import ValidationButtonActions from "new_front/components/CreateSamples/ValidateSamples/AnnotationInterfaces/ValidationButtonActions";
import useFetch from "use-http";

const ValidateSamples: FC = () => {
  const [taskInfoName, setTaskInfoName] = useState<string>("");
  const { get, post, response, loading } = useFetch();
  const [generalInstructions, setGeneralInstructions] = useState<string>("");
  const [metadataValidation, setMetadataValidation] = useState<object>({});
  const { hidden, setHidden } = useContext(OverlayContext);

  const updateMetadataValidation = (input: object) => {
    setMetadataValidation((prevMetadataValidation) => {
      return { ...prevMetadataValidation, ...input };
    });
  };

  const responseModel = {
    context: "Please pretend you are reviewing a restaurant, movie, or book.",
    statement: "This is a good example.",
    label: "Correct",
    example_explanation: "This is a good example because...",
    model_explanation: "This is a good example because...",
  };

  const taskConfiguration = {
    validation_context: [
      {
        type: "text",
        label: "context",
      },
      {
        type: "text",
        label: "model_explanation",
      },
    ],
    validation_user_input: [
      {
        type: "radio-button-options",
        label: "Actions",
        options: ["🤙 Correct", "👎 Incorrect", "🤌 Flag"],
      },
    ],
  };

  return (
    <>
      <div className="container">
        <div id="title">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <AnnotationTitle
                taskName={taskInfoName}
                subtitle="Validate examples"
              />
            </div>
            <div className="flex items-start justify-end pr-4 pt-14">
              <CreateInterfaceHelpersButton
                generalInstructions={generalInstructions}
              />
            </div>
          </div>
        </div>
        <div className="border-2 p-3">
          <div id="context" className="rounded">
            <ValidationContextStrategy
              config={taskConfiguration?.validation_context as any}
              task={{}}
              responseModel={responseModel}
              onInputChange={updateMetadataValidation}
              hidden={hidden}
            />
          </div>
          <div id="inputUser" className="">
            <ValidationUserInputStrategy
              config={taskConfiguration?.validation_user_input as any}
              task={{}}
              onInputChange={updateMetadataValidation}
              hidden={hidden}
            />
          </div>
          <div>
            <ValidationButtonActions />
          </div>
        </div>
      </div>
    </>
  );
};

export default ValidateSamples;
