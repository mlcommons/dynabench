import UserContext from "containers/UserContext";
import GeneralButton from "new_front/components/Buttons/GeneralButton";
import BasicInput from "new_front/components/Inputs/BasicInput";
import MultiSelectImage from "new_front/components/Lists/MultiSelectImage";
import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import React, { FC, useState, useContext } from "react";
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
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [showImages, setShowImages] = useState<any[]>([]);
  const [artifactsInput, setArtifactsInput] = useState<object>(
    generative_context.artifacts
  );
  const [prompt, setPrompt] = useState<string>("Type your prompt here");
  const { post, loading, response } = useFetch();
  const { user } = useContext(UserContext);
  const { modelInputs, metadataExample, updateModelInputs } = useContext(
    CreateInterfaceContext
  );

  const generateImages = async () => {
    if (metadataExample.hasOwnProperty("label")) {
      const generatedImages = await post("/context/get_generative_contexts", {
        type: generative_context.type,
        artifacts: artifactsInput,
      });
      if (response.ok) {
        setGeneratedImages(generatedImages);
        setShowImages(generatedImages);
      }
    } else {
      Swal.fire({
        title: "Please select the type of your prompt",
        icon: "warning",
      });
    }
  };

  const handlePromptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setArtifactsInput({ ...artifactsInput, prompt: event.target.value });
    setPrompt(event.target.value);
    updateModelInputs({
      [field_names_for_the_model.original_prompt ?? "original_prompt"]:
        event.target.value,
    });
  };

  const handleSelectImage = async (image: string) => {
    setIsGenerativeContext(false);
    updateModelInputs({
      [field_names_for_the_model.select_image ?? "select_image"]: image,
    });
    // createPartialSample()
  };

  const createPartialSample = async () => {
    const partialSampleId = await post(
      `/example/partially_creation_generative_example`,
      {
        example_info: modelInputs,
        context_id: contextId,
        user_id: user.id,
        round_id: realRoundId,
        task_id: taskId,
      }
    );
    if (response.ok) {
      setPartialSampleId(partialSampleId);
    }
  };

  return (
    <>
      {!loading ? (
        <div>
          <div className="grid col-span-1 py-3 justify-items-end">
            <AnnotationInstruction
              placement="left"
              tooltip={
                instruction.prompt ||
                "Select the image that best exemplifies the harm"
              }
            >
              <BasicInput
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
                className="border-0 font-weight-bold light-gray-bg task-action-btn mt-4"
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
                    instructions="Select an image"
                    images={showImages.map(({ image }) => image)}
                    handleFunction={handleSelectImage}
                  />
                </AnnotationInstruction>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid items -center justify-center grid-rows-2">
          <div className="mr-2 text-letter-color">
            Images are being generated, bear with the model
          </div>
          <PacmanLoader
            color="#ccebd4"
            loading={loading}
            size={50}
            className="align-center"
          />
        </div>
      )}
    </>
  );
};

export default SelectBetweenImagesGenerative;
