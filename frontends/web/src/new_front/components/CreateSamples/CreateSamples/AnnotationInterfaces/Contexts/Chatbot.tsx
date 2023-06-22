import GeneralButton from "new_front/components/Buttons/GeneralButton";
import BasicInput from "new_front/components/Inputs/BasicInput";
import EvaluateText from "new_front/components/Inputs/EvaluateText";
import React, { FC, useState } from "react";
import { PacmanLoader } from "react-spinners";
import useFetch from "use-http";

type ChatbotProps = {
  chatHistory: ChatHistoryType;
  type: string;
  setChatHistory: (chatHistory: ChatHistoryType) => void;
  setShowExtraInfo: (showExtraInfo: boolean) => void;
  updateModelInputs: (modelInputs: any) => void;
};

interface ChatHistoryType {
  user: any[];
  bot: any[];
}

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
  const { post, response, loading } = useFetch();

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
      {!loading ? (
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
                          <span className="px-4 py-2 rounded-lg inline-block rounded-br-none bg-[#f0f2f5] text-letter-color">
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
      ) : (
        <div className="grid items-center justify-center grid-rows-2">
          <div className="mr-2 text-letter-color">
            Texts are being generated, bear with the models
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

export default Chatbot;
