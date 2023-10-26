import GeneralButton from "new_front/components/Buttons/GeneralButton";
import BasicInput from "new_front/components/Inputs/BasicInput";
import EvaluateText from "new_front/components/Inputs/EvaluateText";
import React, { FC, useEffect, useState } from "react";
import { PacmanLoader } from "react-spinners";
import useFetch from "use-http";
import Swal from "sweetalert2";
import { ChatHistoryType } from "new_front/types/createSamples/createSamples/utils";
import { Avatar } from "components/Avatar/Avatar";
import parse from "html-react-parser";

type ChatbotProps = {
  instructions: string;
  chatHistory: ChatHistoryType;
  username: string;
  model_name: string;
  provider: string;
  num_of_samples_chatbot: number;
  num_interactions_chatbot: number;
  finishConversation: boolean;
  optionsSlider?: string[];
  setChatHistory: (chatHistory: ChatHistoryType) => void;
  showOriginalInteractions: () => void;
  setFinishConversation: (finishConversation: boolean) => void;
  updateModelInputs: (modelInputs: any) => void;
  setIsGenerativeContext: (isGenerativeContext: boolean) => void;
};

const Chatbot: FC<ChatbotProps> = ({
  instructions,
  chatHistory,
  username,
  model_name,
  provider,
  num_of_samples_chatbot,
  num_interactions_chatbot,
  finishConversation,
  optionsSlider,
  setChatHistory,
  showOriginalInteractions,
  setFinishConversation,
  updateModelInputs,
  setIsGenerativeContext,
}) => {
  const [prompt, setPrompt] = useState("");

  const [numInteractions, setNumInteractions] = useState(0);
  const [isAskingQuestion, setIsAskingQuestion] = useState(true);
  const [newRespones, setNewResponses] = useState<any[]>([]);
  const { post, response, loading } = useFetch();

  const askQuestion = async () => {
    if (prompt !== "") {
      const generatedTexts = await post(
        "/model/conversation_with_buffer_memory",
        {
          history: {
            ...chatHistory,
            user: [
              ...chatHistory.user,
              {
                id: chatHistory.bot[chatHistory.bot.length - 1].id + 1,
                text: prompt,
              },
            ],
          },
          model_name: model_name,
          provider: provider,
          prompt: prompt,
          num_answers: num_of_samples_chatbot,
        },
      );
      if (response.ok) {
        setNewResponses(generatedTexts);
        setIsAskingQuestion(false);
      }
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please enter a question",
      });
    }
  };

  const finishSection = () => {
    updateModelInputs({
      chat_history: chatHistory,
    });
    setIsAskingQuestion(false);
  };

  const saveHistory = () => {
    setChatHistory({
      ...chatHistory,
      user: [
        ...chatHistory.user,
        {
          id: chatHistory.user[chatHistory.user.length - 1].id + 1,
          text: prompt,
        },
      ],
      bot: [
        ...chatHistory.bot,
        {
          id: chatHistory.bot[chatHistory.bot.length - 1].id + 1,
          text: newRespones.reduce(
            (max: { score: number }, answer: { score: number }) =>
              answer.score > max.score ? answer : max,
          ).text,
        },
      ],
    });
    setNewResponses([]);
    setIsAskingQuestion(true);
    setPrompt("");
    setNumInteractions((prev) => prev + 1);
  };

  const saveHistoryValidation = () => {
    const isTied = newRespones.every(
      (text) => text.score === newRespones[0].score && newRespones.length > 1,
    );
    if (isTied) {
      Swal.fire({
        title: "There's a tie",
        text: "Are you sure that you want to continue?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
      }).then((result: any) => {
        if (result.isConfirmed) {
          saveHistory();
        }
      });
    } else {
      saveHistory();
    }
  };

  const handleFinishInteraction = () => {
    showOriginalInteractions();
    finishSection();
    setIsGenerativeContext(false);
    setFinishConversation(true);
  };

  return (
    <>
      {!loading ? (
        <>
          {!finishConversation && (
            <>
              <h3 className="pt-1 pb-6 pl-6 text-lg font-bold text-letter-color">
                {parse(instructions)}
              </h3>
              <div id="history-chat">
                {chatHistory.user.length > 0 &&
                  chatHistory.bot.length > 0 &&
                  chatHistory.user.map((message, index) => (
                    <div key={index}>
                      <div className="chat-message">
                        <div className="flex items-end">
                          <div className="flex flex-col items-start order-2 max-w-lg mx-2 space-y-2">
                            <div>
                              <Avatar
                                avatar_url={null}
                                username={username}
                                isThumbnail={true}
                                theme="dark"
                              />
                              <span className="px-3 py-1 rounded-lg inline-block rounded-br-none bg-[#f0f2f5] text-letter-color">
                                {message.text}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="chat-message">
                        <div className="flex items-end justify-end">
                          <div className="flex flex-col items-end order-1 max-w-lg mx-2 space-y-2">
                            <div className="min-w-[16rem] md:min-w-[26rem] lg:min-w-[32rem]">
                              <textarea
                                className="inline-block w-full px-3 py-2 text-white rounded-lg rounded-bl-none bg-third-color"
                                disabled={true}
                                value={chatHistory.bot[index].text}
                                rows={5}
                              />
                            </div>
                          </div>
                          <img
                            src="https://cdn-icons-png.flaticon.com/512/427/427995.png?w=1060&t=st=1687313158~exp=1687313758~hmac=a9f0bae6d29fe6f316f7fa531188e34fe0f562db16c7ea5fa53b3105bab66f6f"
                            alt="My profile"
                            className="order-2 rounded-full w-7 h-7"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                {prompt !== "" && !isAskingQuestion && (
                  <div className="chat-message">
                    <div className="flex items-end">
                      <div className="flex flex-col items-start order-2 max-w-lg mx-2 space-y-2">
                        <div>
                          <Avatar
                            avatar_url={null}
                            username={username}
                            isThumbnail={true}
                            theme="dark"
                          />
                          <span className="px-3 py-1 rounded-lg inline-block rounded-br-none bg-[#f0f2f5] text-letter-color">
                            {prompt}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div id="interacion block">
                <div className="flex items-end">
                  <div className="flex flex-col items-start order-2 w-full max-w-lg pt-2 mx-2 space-y-2">
                    {isAskingQuestion && (
                      <BasicInput
                        placeholder="Enter text here. Do not copy and paste"
                        onChange={(e) => setPrompt(e.target.value)}
                        onEnter={askQuestion}
                      />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 pt-8">
                  {newRespones &&
                    newRespones.map((response, key) => (
                      <EvaluateText
                        key={key}
                        name={response.model_letter}
                        text={response.text}
                        id={response.id}
                        texts={newRespones}
                        setTexts={setNewResponses}
                        optionsSlider={optionsSlider}
                      />
                    ))}
                </div>
                <div className="flex justify-end gap-2 ">
                  {isAskingQuestion ? (
                    <div>
                      <GeneralButton
                        onClick={askQuestion}
                        text="Send"
                        className="px-4 py-1 font-semibold border-0 font-weight-bold light-gray-bg task-action-btn "
                      />
                    </div>
                  ) : (
                    <div>
                      <GeneralButton
                        onClick={saveHistoryValidation}
                        text="Save"
                        className="px-4 py-1 font-semibold border-0 font-weight-bold light-gray-bg task-action-btn "
                      />
                    </div>
                  )}
                  {numInteractions >= num_interactions_chatbot && (
                    <div>
                      <GeneralButton
                        onClick={handleFinishInteraction}
                        text="Finish"
                        className="px-4 py-1 font-semibold border-0 font-weight-bold light-gray-bg task-action-btn"
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
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
