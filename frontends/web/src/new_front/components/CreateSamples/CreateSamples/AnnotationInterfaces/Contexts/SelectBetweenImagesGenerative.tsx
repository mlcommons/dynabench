import GeneralButton from "new_front/components/Buttons/GeneralButton";
import BasicInput from "new_front/components/Inputs/BasicInput";
import MultiSelectImage from "new_front/components/Lists/MultiSelectImage";
import MultiSelectImages from "new_front/components/Lists/MultiSelectImages";
import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { ContextConfigType } from "new_front/types/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/annotationFactory";
import React, { FC, useState } from "react";
import useFetch from "use-http";

const SelectBetweenImagesGenerative: FC<
  ContextAnnotationFactoryType & ContextConfigType
> = ({
  field_names_for_the_model,
  onInputChange,
  setIsGenerativeContext,
  hidden,
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
  const { post, response } = useFetch();

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
    onInputChange({
      [field_names_for_the_model.prompt ?? "original_prompt"]:
        event.target.value,
    });
  };

  const handleSelectImage = (image: string) => {
    setSelectImage(image);
    setIsGenerativeContext(false);
    setShowImages([
      {
        image: image,
      },
    ]);
    setShowOtherImages(true);
    onInputChange({
      [field_names_for_the_model.select_image ?? "select_image"]: image,
    });
  };

  const handleSelectOtherImages = (images: string[]) => {
    onInputChange({
      [field_names_for_the_model.select_other_images ?? "select_other_images"]:
        images,
    });
  };

  return (
    <div>
      {generatedImages.length === 0 ? (
        <>
          <div className="grid col-span-1 py-3 justify-items-end">
            <BasicInput onChange={handlePromptChange} placeholder="Prompt" />
            <GeneralButton onClick={generateImages} text="Generate Images" />
          </div>
        </>
      ) : (
        <>
          <BasicInput placeholder={prompt} disabled={true} />
          <div>
            {/* <AnnotationInstruction
              placement="top"
              tooltip="Select the image"
              hidden={hidden!}
            > */}
            <MultiSelectImage
              instructions="Select an image"
              images={showImages.map(({ image }) => image)}
              handleFunction={handleSelectImage}
            />
            {/* </AnnotationInstruction> */}
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
  );
};

export default SelectBetweenImagesGenerative;
