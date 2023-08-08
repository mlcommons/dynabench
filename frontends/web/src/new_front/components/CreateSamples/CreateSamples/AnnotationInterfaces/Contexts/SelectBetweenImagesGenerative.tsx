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
import { getIdFromImageString } from "new_front/utils/helpers/functions/DataManipulation";
import { PacmanLoader } from "react-spinners";
import Swal from "sweetalert2";
import useFetch from "use-http";
import useFetchSSE from "new_front/utils/helpers/functions/FetchSSE";

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
  const [firstMessageReceived, setFirstMessageReceived] = useState(false);
  const [allowsGeneration, setAllowsGeneration] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [showImages, setShowImages] = useState<any[]>([]);
  const [artifactsInput, setArtifactsInput] = useState<any>(
    generative_context.artifacts,
  );
  const [prompt, setPrompt] = useState(
    "Type your prompt here (e.g. a kid sleeping in a red pool of paint)",
  );
  const { post, response } = useFetch();
  const { post: postSSE, clear: clearCache } = useFetchSSE(
    process.env.REACT_APP_API_HOST_2_s || "http://localhost:8000",
  );
  const { user } = useContext(UserContext);
  const { modelInputs, metadataExample, updateModelInputs } = useContext(
    CreateInterfaceContext,
  );
  const neccessaryFields = ["original_prompt"];
  const [selectedImage, setSelectedImage] = useState<string>("");

  const getHistoricalData = async () => {
    const history = await post(
      "/historical_data/get_historical_data_by_task_and_user",
      {
        task_id: taskId,
        user_id: user.id,
      },
    );
    if (response.ok) {
      setPromptHistory(history);
    }
  };

  const saveHistoricalData = async (
    text: string,
    setPromptHistory: (value: any[]) => void,
  ) => {
    const history = await post("/historical_data/save_historical_data", {
      task_id: taskId,
      user_id: user.id,
      data: text.trim(),
    });
    if (response.ok) {
      setPromptHistory(history);
    }
  };

  const generateImages = async () => {
    if (
      neccessaryFields.every(
        (item) =>
          modelInputs.hasOwnProperty(item) ||
          metadataExample.hasOwnProperty(item),
      )
    ) {
      await postSSE({
        url: "/context/stream",
        body: {
          type: generative_context.type,
          artifacts: artifactsInput,
        },
        setSaveData: setShowImages,
        setExternalLoading: setShowLoader,
        firstMessage: firstMessageReceived,
        setFirstMessage: setFirstMessageReceived,
        setAllowsGeneration: setAllowsGeneration,
      });
      await saveHistoricalData(prompt, setPromptHistory);
      setIsGenerativeContext(true);
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "You need to fill all the fields!",
      });
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

  const handlePromptHistory = async (prompt: string) => {
    setArtifactsInput({
      ...artifactsInput,
      prompt: prompt,
      user_id: user.id,
    });
    setPrompt(prompt);
    updateModelInputs({
      [field_names_for_the_model.original_prompt ?? "original_prompt"]: prompt,
    });
    await postSSE({
      url: "/context/stream",
      body: {
        type: generative_context.type,
        artifacts: {
          ...artifactsInput,
          prompt: prompt,
          user_id: user.id,
        },
      },
      setSaveData: setShowImages,
      setExternalLoading: setShowLoader,
      firstMessage: firstMessageReceived,
      setFirstMessage: setFirstMessageReceived,
      setAllowsGeneration: setAllowsGeneration,
    });
    setIsGenerativeContext(true);
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
    if (contextId && user.id && realRoundId && taskId) {
      const partialSampleId = await post(
        `/example/partial_creation_generative_example`,
        {
          example_info: modelInputs,
          context_id: contextId,
          user_id: user.id,
          round_id: realRoundId,
          task_id: taskId,
        },
      );
      if (response.ok) {
        setPartialSampleId(partialSampleId.id);
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
        });
      }
    }
  };

  const cleanHistory = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will not be able to recover this history!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, keep it",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await post("/historical_data/delete_historical_data", {
          task_id: taskId,
          user_id: user.id,
        });
        setPromptHistory([]);
        Swal.fire("Deleted!", "Your history has been deleted.", "success");
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire("Cancelled", "Your history is safe :)", "error");
      }
    });
  };

  useEffect(() => {
    getHistoricalData();
    clearCache();
  }, []);

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
                "“Click here to view a log of all your previously attempted prompts”"
              }
            >
              <Dropdown
                options={promptHistory.map((item) => item.history)}
                placeholder="Find your previous prompts here           "
                onChange={handlePromptHistory}
                disabled={!allowsGeneration}
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
                value={prompt}
                disabled={!allowsGeneration}
              />
            </AnnotationInstruction>
            <div className="flex justify-end gap-2">
              <GeneralButton
                onClick={cleanHistory}
                text="Clean History"
                className="mt-4 border-0 font-weight-bold light-gray-bg task-action-btn"
              />
              <AnnotationInstruction
                placement="top"
                tooltip={
                  instruction.generate_button ||
                  "Select one of the options below"
                }
              >
                <GeneralButton
                  onClick={generateImages}
                  text="Generate Images"
                  className="mt-4 border-0 font-weight-bold light-gray-bg task-action-btn"
                  disabled={!allowsGeneration}
                />
              </AnnotationInstruction>
            </div>
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
                    instructions={
                      !allowsGeneration
                        ? "12 high-resolution images are currently being generated in batches of 4. Allow a few seconds for all images to appear. In the meantime, you can select one of the images below."
                        : "Inspect all images and select an unsafe image to submit. Alternatively, modify your prompt and generate new image set."
                    }
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
            12 High-resolution images are currently being generated in batches
            of 4. <br /> To view all images, please allow a few seconds after
            the initial batch appears.
            <br />
            Please do not refresh the page or leave it.
          </div>
          <PacmanLoader
            color="#ccebd4"
            loading={showLoader}
            size={50}
            className="flex align-center"
          />
        </div>
      )}
    </>
  );
};

export default SelectBetweenImagesGenerative;
