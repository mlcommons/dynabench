import UserContext from "containers/UserContext";
import GeneralButton from "new_front/components/Buttons/GeneralButton";
import BasicInputRemain from "new_front/components/Inputs/BasicInputRemain";
import Dropdown from "new_front/components/Inputs/Dropdown";
import MultiSelectImage from "new_front/components/Lists/MultiSelectImage";
import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import React, { FC, useState, useContext, useEffect } from "react";
import {
  saveListToLocalStorage,
  getListFromLocalStorage,
  addElementToListInLocalStorage,
} from "new_front/utils/helpers/functions/LocalStorage";
import { PacmanLoader } from "react-spinners";
import Swal from "sweetalert2";
import useFetch from "use-http";
import EvaluateText from "new_front/components/Inputs/EvaluateText";
import { Button, Modal } from "react-bootstrap";

const EvaluateTextsGenerative: FC<
  ContextAnnotationFactoryType & ContextConfigType
> = ({
  field_names_for_the_model,
  generative_context,
  instruction,
  contextId,
  taskId,
  realRoundId,
  setIsGenerativeContext,
  setPartialSampleId,
}) => {
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [texts, setTexts] = useState<any[]>([]);
  const [showExtraInfo, setShowExtraInfo] = useState<boolean>(false);
  const [artifactsInput, setArtifactsInput] = useState<any>(
    generative_context.artifacts
  );
  const [prompt, setPrompt] = useState<string>("Ask the model a question");
  const { post, response } = useFetch();
  const { user } = useContext(UserContext);
  const { modelInputs, metadataExample, updateModelInputs } = useContext(
    CreateInterfaceContext
  );

  const generateTexts = async () => {
    setShowLoader(true);
    const generatedTexts = await post("/context/get_generative_contexts", {
      type: generative_context.type,
      artifacts: artifactsInput,
    });
    if (response.ok) {
      setTexts(generatedTexts);
    }
    setShowLoader(false);
  };

  const handlePromptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setArtifactsInput({
      ...artifactsInput,
      prompt: event.target.value,
      user_id: user.id,
    });
    setPrompt(event.target.value);
    updateModelInputs({
      [field_names_for_the_model.original_prompt ?? "original_prompt"]:
        event.target.value,
    });
  };

  useEffect(() => {
    if (modelInputs) {
      console.log("modelInputs", modelInputs);
    }
  }, [modelInputs]);

  return (
    <>
      {!showLoader ? (
        <div>
          <div className="grid col-span-1 py-3 justify-items-end">
            <div className="grid grid-cols-3 w-full gap-6">
              <div className="col-span-2">
                <AnnotationInstruction
                  placement="left"
                  tooltip={
                    instruction.prompt ||
                    "Select the text that best exemplifies the harm"
                  }
                >
                  <BasicInputRemain
                    onChange={handlePromptChange}
                    onEnter={generateTexts}
                    placeholder={prompt}
                  />
                </AnnotationInstruction>
              </div>
              <div className="col-span-1 z-40">
                <AnnotationInstruction
                  placement="left"
                  tooltip={
                    "“Click here to view a log of all your previously attempted prompts”"
                  }
                >
                  <Dropdown
                    options={artifactsInput.categories}
                    placeholder="Categories"
                    onChange={() => {}}
                  />
                </AnnotationInstruction>
              </div>
            </div>
            <AnnotationInstruction
              placement="top"
              tooltip={
                instruction.generate_button || "Select one of the options below"
              }
            >
              <GeneralButton
                onClick={generateTexts}
                text="Ask the model a question"
                className=" border-0 font-weight-bold light-gray-bg task-action-btn"
              />
            </AnnotationInstruction>
          </div>
          {texts.length === 0 ? (
            <></>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6">
                <>
                  {texts.map((text, index) => (
                    <EvaluateText text={text.text} id={index.toString()} />
                  ))}
                </>
              </div>
              <div className="grid col-span-1 py-3 justify-items-end">
                <GeneralButton
                  onClick={() => {
                    setShowExtraInfo(true);
                  }}
                  text="Save"
                  className=" border-0 font-weight-bold light-gray-bg task-action-btn"
                />
                <Modal
                  show={showExtraInfo}
                  onHide={() => setShowExtraInfo(false)}
                >
                  <Modal.Header
                    closeButton
                    onHide={() => setShowExtraInfo(false)}
                  >
                    <Modal.Title>Explanation</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <h5 className="text-lg pb-6">
                      Your prefer output is the answer of the model A. What do
                      you like and dislike about the answer?
                    </h5>
                    <input className="w-full p-3 rounded-1 thick-border bg-[#f0f2f5]" />
                    <div
                      className="flex justify-center col-span-3 gap-8"
                      id="submit"
                    >
                      <Button
                        variant="primary"
                        className="max-w-xs my-4 submit-btn button-ellipse text-uppercase"
                      >
                        Save
                      </Button>
                    </div>
                  </Modal.Body>
                </Modal>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid items-center justify-center grid-rows-2">
          <div className="mr-2 text-letter-color">
            Texts are being generated, bear with the models
          </div>
          <PacmanLoader
            color="#ccebd4"
            loading={showLoader}
            size={50}
            className="align-center"
          />
        </div>
      )}
    </>
  );
};

export default EvaluateTextsGenerative;
