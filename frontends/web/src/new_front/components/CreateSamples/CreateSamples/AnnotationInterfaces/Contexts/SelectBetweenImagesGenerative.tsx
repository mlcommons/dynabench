import UserContext from "containers/UserContext";
import GeneralButton from "new_front/components/Buttons/GeneralButton";
import BasicInput from "new_front/components/Inputs/BasicInput";
import MultiSelectImage from "new_front/components/Lists/MultiSelectImage";
import MultiSelectImages from "new_front/components/Lists/MultiSelectImages";
import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import React, { FC, useState, useContext } from "react";
import { PacmanLoader } from "react-spinners";
import useFetch from "use-http";

const SelectBetweenImagesGenerative: FC<
  ContextAnnotationFactoryType & ContextConfigType
> = ({
  field_names_for_the_model,
  contextId,
  taskId,
  realRoundId,
  setIsGenerativeContext,
  setPartialSampleId,
}) => {
  const type = "nibbler";
  const artifacts = {
    endpoint: "https://www.google.com",
  };
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [showImages, setShowImages] = useState<any[]>([]);
  const [artifactsInput, setArtifactsInput] = useState<object>(artifacts);
  const [prompt, setPrompt] = useState<string>("");
  const [selectImage, setSelectImage] = useState<string>("");
  const [showOtherImages, setShowOtherImages] = useState<boolean>(false);
  const { post, loading, response } = useFetch();
  const { user } = useContext(UserContext);
  const { modelInputs, updateModelInputs } = useContext(CreateInterfaceContext);

  const generateImages = async () => {
    const generatedImages = await post("/context/get_generative_contexts", {
      type: type,
      artifacts: artifactsInput,
    });
    if (response.ok) {
      setGeneratedImages(generatedImages);
      setShowImages(generatedImages);
    }
  };

  const handlePromptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setArtifactsInput({ ...artifactsInput, prompt: event.target.value });
    setPrompt(event.target.value);
    updateModelInputs({
      [field_names_for_the_model.prompt ?? "original_prompt"]:
        event.target.value,
    });
  };

  const handleSelectImage = async (image: string) => {
    setSelectImage(image);
    setIsGenerativeContext(false);
    setShowImages([
      {
        image: image,
      },
    ]);
    setShowOtherImages(true);
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

  const handleSelectOtherImages = (images: string[]) => {
    updateModelInputs({
      [field_names_for_the_model.select_other_images ?? "select_other_images"]:
        images,
    });
  };

  return (
    <>
      {!loading ? (
        <div>
          <div className="grid col-span-1 py-3 justify-items-end">
            <BasicInput
              onChange={handlePromptChange}
              placeholder="Type the image you want to generate "
            />
            <GeneralButton
              onClick={generateImages}
              text="Generate Images"
              className="border-0 font-weight-bold light-gray-bg task-action-btn mt-4"
            />
          </div>
          {showImages.length === 0 ? (
            <></>
          ) : (
            <>
              <BasicInput placeholder={prompt} disabled={true} />
              <div>
                <AnnotationInstruction
                  placement="left"
                  tooltip="Selected image"
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
          {showOtherImages && (
            <>
              <div>
                <MultiSelectImages
                  instructions="Select other images"
                  images={generatedImages
                    .map(({ image }) => image)
                    .filter((image) => image !== selectImage)}
                  handleFunction={handleSelectOtherImages}
                />
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
