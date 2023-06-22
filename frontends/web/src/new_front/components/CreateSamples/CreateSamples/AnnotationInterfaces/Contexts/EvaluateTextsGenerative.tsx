import UserContext from "containers/UserContext";
import GeneralButton from "new_front/components/Buttons/GeneralButton";
import BasicInput from "new_front/components/Inputs/BasicInput";
import Dropdown from "new_front/components/Inputs/Dropdown";
import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import React, { FC, useState, useContext, useEffect } from "react";
import { PacmanLoader } from "react-spinners";
import Swal from "sweetalert2";
import useFetch from "use-http";
import EvaluateText from "new_front/components/Inputs/EvaluateText";
import { Button, Modal } from "react-bootstrap";
import Chatbot from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/Contexts/Chatbot";

interface ChatHistoryType {
  user: any[];
  bot: any[];
}

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
  const [chatHistory, setChatHistory] = useState<ChatHistoryType>({
    user: [],
    bot: [],
  });
  const [showExtraInfo, setShowExtraInfo] = useState<boolean>(false);
  const [showChatbot, setShowChatbot] = useState<boolean>(false);
  const [showAnswers, setShowAnswers] = useState<boolean>(false);
  const [artifactsInput, setArtifactsInput] = useState<any>(
    generative_context.artifacts
  );
  const [prompt, setPrompt] = useState<string>("Ask the model a question");
  const [categoryPrompt, setCategoryPrompt] = useState<string>("Categories");
  const { post, response } = useFetch();
  const { user } = useContext(UserContext);
  const { modelInputs, updateModelInputs } = useContext(CreateInterfaceContext);

  const handleSaveCategory = async (category: string) => {
    updateModelInputs({
      category: category,
    });
    setCategoryPrompt(category);
  };

  const generateTexts = async () => {
    setShowLoader(true);
    // const generatedTexts = await post('/context/get_generative_contexts', {
    //   type: generative_context.type,
    //   artifacts: artifactsInput,
    // })
    // if (response.ok) {
    //   setTexts(generatedTexts)
    //   updateModelInputs({
    //     [field_names_for_the_model.generated_answers ??
    //     'generated_answers']: generatedTexts,
    //   })
    // }
    const generatedTexts = [
      {
        id: "1",
        model_name: "GPT-3",
        text: "This is a generated text",
        score: 0.9,
      },
      {
        id: "2",
        model_name: "GPT-2",
        text: "This is another generated text",
        score: 0.8,
      },
      {
        id: "3",
        model_name: "GPT-1",
        text: "This is a generated text",
        score: 0.7,
      },
      {
        id: "4",
        model_name: "GPT-4",
        text: "This is another generated text",
        score: 0.6,
      },
    ];
    setTexts(generatedTexts);

    setChatHistory({
      ...chatHistory,
      user: [
        ...chatHistory.user,
        {
          id: "1",
          text: prompt,
        },
      ],
    });
    setShowLoader(false);
    setShowAnswers(true);
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

  const handleSelectedText = () => {
    updateModelInputs({
      [field_names_for_the_model.best_answer ?? "best_answer"]: texts.reduce(
        (max: { score: number }, answer: { score: number }) =>
          answer.score > max.score ? answer : max
      ),
    });

    setChatHistory({
      ...chatHistory,
      bot: [
        ...chatHistory.bot,
        {
          id: "1",
          text: texts.reduce(
            (max: { score: number }, answer: { score: number }) =>
              answer.score > max.score ? answer : max
          ).text,
        },
      ],
    });
    setShowChatbot(true);
    setShowAnswers(false);
  };

  useEffect(() => {
    updateModelInputs({
      [field_names_for_the_model.generated_answers ?? "generated_answers"]:
        texts,
    });
  }, [texts]);

  useEffect(() => {
    if (modelInputs) {
      console.log("modelInputs", modelInputs);
    }
  }, [modelInputs, texts]);

  useEffect(() => {
    console.log("chatHistory", chatHistory);
  }, [chatHistory]);

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
                  <BasicInput
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
                    placeholder={categoryPrompt}
                    onChange={handleSaveCategory}
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
          {showAnswers && (
            <>
              <div className="grid grid-cols-2 gap-6">
                {texts.map((text) => (
                  <EvaluateText
                    name={text.model_letter}
                    text={text.text}
                    id={text.id}
                    texts={texts}
                    setTexts={setTexts}
                  />
                ))}
              </div>
              <div className="grid col-span-1 py-3 justify-items-end">
                <GeneralButton
                  onClick={handleSelectedText}
                  text="Save"
                  className=" border-0 font-weight-bold light-gray-bg task-action-btn"
                />
              </div>
            </>
          )}
          {showChatbot && (
            <Chatbot
              chatHistory={chatHistory}
              type={generative_context.type}
              setChatHistory={setChatHistory}
              setShowExtraInfo={setShowExtraInfo}
              updateModelInputs={updateModelInputs}
            />
          )}
          {showExtraInfo && (
            <ExtraInfo
              showExtraInfo={showExtraInfo}
              setShowExtraInfo={setShowExtraInfo}
            />
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

type ExtraInfoProps = {
  showExtraInfo: boolean;
  setShowExtraInfo: (show: boolean) => void;
};

const ExtraInfo: FC<ExtraInfoProps> = ({ showExtraInfo, setShowExtraInfo }) => {
  return (
    <Modal show={showExtraInfo} onHide={() => setShowExtraInfo(false)}>
      <Modal.Header closeButton onHide={() => setShowExtraInfo(false)}>
        <Modal.Title>Explanation</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h5 className="text-lg pb-6">
          Your prefer output is the answer of the model A. What do you like and
          dislike about the answer?
        </h5>
        <input className="w-full p-3 rounded-1 thick-border bg-[#f0f2f5]" />
        <div className="flex justify-center col-span-3 gap-8" id="submit">
          <Button
            variant="primary"
            className="max-w-xs my-4 submit-btn button-ellipse text-uppercase"
            onClick={() => setShowExtraInfo(false)}
          >
            Save
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default EvaluateTextsGenerative;
