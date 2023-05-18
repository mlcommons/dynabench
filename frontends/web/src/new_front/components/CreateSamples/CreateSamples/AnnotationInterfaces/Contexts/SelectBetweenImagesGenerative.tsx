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
import { getIdFromImageString } from "new_front/utils/helpers/functions/DataManipulation";
import { PacmanLoader } from "react-spinners";
import Swal from "sweetalert2";
import useFetch from "use-http";

const SelectBetweenImagesGenerative: FC<
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
  const [promptHistory, setPromptHistory] = useState<any[]>([]);
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [showImages, setShowImages] = useState<any[]>([]);
  const [artifactsInput, setArtifactsInput] = useState<any>(
    generative_context.artifacts
  );
  const [prompt, setPrompt] = useState<string>("Type your prompt here");
  const { post, response } = useFetch();
  const { user } = useContext(UserContext);
  const { modelInputs, metadataExample, updateModelInputs } = useContext(
    CreateInterfaceContext
  );

  const [selectedImage, setSelectedImage] = useState<string>("");

  const generateImages = async () => {
    setShowLoader(true);
    const generatedImages = await post("/context/get_generative_contexts", {
      type: generative_context.type,
      artifacts: artifactsInput,
    });
    if (response.ok) {
      setShowImages(generatedImages);
      addElementToListInLocalStorage(artifactsInput.prompt, "promptHistory");
      setPromptHistory(getListFromLocalStorage("promptHistory"));
      setShowLoader(false);
    }
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

  const handlePromptHistory = (prompt: string) => {
    setArtifactsInput({
      ...artifactsInput,
      prompt: prompt,
      user_id: user.id,
    });
    setPrompt(prompt);
    updateModelInputs({
      [field_names_for_the_model.original_prompt ?? "original_prompt"]: prompt,
    });
  };

  const handleSelectImage = async (image: string) => {
    setIsGenerativeContext(false);
    updateModelInputs({
      [field_names_for_the_model.select_image ?? "select_image"]:
        getIdFromImageString(showImages, image),
    });
    setSelectedImage(image);
  };

  const CreatePartialSample = async () => {
    const partialSampleId = await post(
      `/example/partial_creation_generative_example`,
      {
        example_info: modelInputs,
        context_id: contextId,
        user_id: user.id,
        round_id: realRoundId,
        task_id: taskId,
      }
    );
    if (response.ok) {
      setPartialSampleId(partialSampleId.id);
    }
  };

  useEffect(() => {
    saveListToLocalStorage([], "promptHistory");
    setPromptHistory(getListFromLocalStorage("promptHistory"));
  }, []);

  useEffect(() => {
    localStorage.setItem("promptHistory", JSON.stringify(promptHistory));
  }, [promptHistory]);

  useEffect(() => {
    if (modelInputs.hasOwnProperty("select_image")) {
      CreatePartialSample();
    }
  }, [selectedImage]);

  return (
    <>
      {!showLoader ? (
        <div>
          <div className="grid col-span-1 py-3 justify-items-end">
            <AnnotationInstruction
              placement="left"
              tooltip={
                instruction.prompt ||
                "“Click here to view a log of all your previously attempted prompts”"
              }
            >
              <Dropdown
                options={promptHistory}
                placeholder=""
                onChange={handlePromptHistory}
              />
            </AnnotationInstruction>
            <AnnotationInstruction
              placement="left"
              tooltip={
                instruction.prompt ||
                "Select the image that best exemplifies the harm"
              }
            >
              <BasicInputRemain
                onChange={handlePromptChange}
                onEnter={generateImages}
                placeholder={prompt}
              />
            </AnnotationInstruction>
            <AnnotationInstruction
              placement="top"
              tooltip={
                instruction.generate_button || "Select one of the options below"
              }
            >
              <GeneralButton
                onClick={generateImages}
                text="Generate Images"
                className="mt-4 border-0 font-weight-bold light-gray-bg task-action-btn"
              />
            </AnnotationInstruction>
          </div>
          {showImages.length === 0 ? (
            <></>
          ) : (
            <>
              <div>
                <AnnotationInstruction
                  placement="left"
                  tooltip={
                    instruction.select_image ||
                    "Select the image that best exemplifies the harm"
                  }
                >
                  <MultiSelectImage
                    selectedImage={selectedImage}
                    instructions="Please select an image. A blank image indicates the the model could not generate an image."
                    images={showImages.map(({ image }) => image)}
                    handleFunction={handleSelectImage}
                  />
                </AnnotationInstruction>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid items-center justify-center grid-rows-2">
          <div className="mr-2 text-letter-color">
            Images are being generated, bear with the model
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

export default SelectBetweenImagesGenerative;
