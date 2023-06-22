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
import { set } from "react-ga";

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
  const [selectedText, setSelectedText] = useState<any>({
    id: "",
    text: "",
  });
  const [chatHistory, setChatHistory] = useState<ChatHistoryType>({
    user: [],
    bot: [],
  });
  const [showExtraInfo, setShowExtraInfo] = useState<boolean>(false);
  const [showChatbot, setShowChatbot] = useState<boolean>(false);
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
    const generatedTexts = await post("/context/get_generative_contexts", {
      type: generative_context.type,
      artifacts: artifactsInput,
    });
    if (response.ok) {
      setTexts(generatedTexts);
      updateModelInputs({
        [field_names_for_the_model.generated_answers ?? "generated_answers"]:
          generatedTexts,
      });
    }
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
    setTexts([]);
    setSelectedText(
      texts.reduce((max: { score: number }, answer: { score: number }) =>
        answer.score > max.score ? answer : max
      )
    );
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
          {texts.length === 0 ? (
            <></>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6">
                {texts.map((text, index) => (
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

type ChatbotProps = {
  chatHistory: ChatHistoryType;
  type: string;
  setChatHistory: (chatHistory: ChatHistoryType) => void;
  setShowExtraInfo: (showExtraInfo: boolean) => void;
  updateModelInputs: (modelInputs: any) => void;
};

const Chatbot: FC<ChatbotProps> = ({
  chatHistory,
  type,
  setChatHistory,
  setShowExtraInfo,
  updateModelInputs,
}) => {
  const [prompt, setPrompt] = useState("");
  const [isAskingQuestion, setIsAskingQuestion] = useState(true);
  const [newRespones, setNewResponses] = useState<any[]>([]);
  const { post, response } = useFetch();

  const askQuestion = async () => {
    const artifact = chatHistory.user
      .map(
        (message: any, index) =>
          `user: ${message.text}\nbot: ${chatHistory.bot[index].text}\n`
      )
      .join("");
    let artifactsInput = {
      prompt: artifact,
    };
    const generatedTexts = await post("/context/get_generative_contexts", {
      type: type,
      artifacts: artifactsInput,
    });

    if (response.ok) {
      setNewResponses(generatedTexts);
      setIsAskingQuestion(false);
    }
  };

  const finishSection = () => {
    setShowExtraInfo(true);
    updateModelInputs({
      chat_history: chatHistory.bot,
    });
  };

  const handleUpdateHistory = () => {
    setChatHistory({
      ...chatHistory,
      user: [
        ...chatHistory.user,
        {
          id: "2",
          text: prompt,
        },
      ],
      bot: [
        ...chatHistory.bot,
        {
          id: "1",
          text: newRespones.reduce(
            (max: { score: number }, answer: { score: number }) =>
              answer.score > max.score ? answer : max
          ).text,
        },
      ],
    });
    setNewResponses([]);
    setIsAskingQuestion(true);
    setPrompt("");
  };

  return (
    <>
      <div id="history-chat">
        {chatHistory.user.length > 0 &&
          chatHistory.bot.length > 0 &&
          chatHistory.user.map((message, index) => (
            <div>
              <div className="chat-message">
                <div className="flex items-end">
                  <div className="flex flex-col space-y-2 mx-2 order-2 items-start max-w-lg">
                    <div>
                      <span className="p-3 h-12 rounded-1 thick-border bg-[#f0f2f5] text-base rounded-md font-medium">
                        {message.text}
                      </span>
                    </div>
                  </div>
                  <img
                    src="https://dynabench-us-west-1-096166425824.s3-us-west-1.amazonaws.com/profile/73c6feb0-7d61-48b8-9999-48164c406464.jpg"
                    alt="My profile"
                    className="w-8 h-8 rounded-full order-1"
                  />
                </div>
              </div>
              <div className="chat-message">
                <div className="flex items-end justify-end">
                  <div className="flex flex-col space-y-2 max-w-lg mx-2 order-1 items-end">
                    <div>
                      <span className="px-4 py-2 rounded-lg inline-block rounded-br-none bg-third-color text-white ">
                        {chatHistory.bot[index].text}
                      </span>
                    </div>
                  </div>
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/427/427995.png?w=1060&t=st=1687313158~exp=1687313758~hmac=a9f0bae6d29fe6f316f7fa531188e34fe0f562db16c7ea5fa53b3105bab66f6f"
                    alt="My profile"
                    className="w-7 h-7 rounded-full order-2"
                  />
                </div>
              </div>
            </div>
          ))}
      </div>

      <div id="interacion block">
        <div className="flex items-end">
          <div className="flex flex-col space-y-2 mx-2 order-2 items-start max-w-lg">
            <div>
              <BasicInput
                placeholder="ask"
                onChange={(e) => setPrompt(e.target.value)}
                onEnter={askQuestion}
              />
            </div>
          </div>
          <img
            src="https://dynabench-us-west-1-096166425824.s3-us-west-1.amazonaws.com/profile/73c6feb0-7d61-48b8-9999-48164c406464.jpg"
            alt="My profile"
            className="w-7 h-7 rounded-full order-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-6 pt-8">
          {newRespones &&
            newRespones.map((response) => (
              <>
                <EvaluateText
                  name={response.model_letter}
                  text={response.text}
                  id={response.id}
                  texts={newRespones}
                  setTexts={setNewResponses}
                />
              </>
            ))}
        </div>
        {isAskingQuestion ? (
          <div className="flex justify-end col-span-3 gap-6">
            <GeneralButton
              onClick={askQuestion}
              text="Ask"
              className=" px-6 border-0 text-lg font-weight-bold light-gray-bg task-action-btn max-w-md"
            />
            <GeneralButton
              onClick={finishSection}
              text="Finish"
              className=" px-6 text-lg border-0 font-weight-bold light-gray-bg task-action-btn"
            />
          </div>
        ) : (
          <div className="grid col-span-1 py-3 justify-items-end">
            <GeneralButton
              onClick={handleUpdateHistory}
              text="Save"
              className=" border-0 font-weight-bold light-gray-bg task-action-btn"
            />
          </div>
        )}
      </div>
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
