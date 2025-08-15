import React, { FC, useEffect, useState } from "react";
import { PacmanLoader } from "react-spinners";
import Swal from "sweetalert2";
import useFetch from "use-http";
import parse from "html-react-parser";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";

import GeneralButton from "new_front/components/Buttons/GeneralButton";
import BasicInputSeveralRows from "new_front/components/Inputs/BasicInputSeveralRows";
import EvaluateText from "new_front/components/Inputs/EvaluateText";
import { ChatbotProps } from "new_front/types/createSamples/createSamples/utils";
import { Avatar } from "components/Avatar/Avatar";

const Chatbot: FC<ChatbotProps> = ({
  instructions,
  chatHistory,
  username,
  modelName,
  provider,
  numOfSamplesChatbot,
  numInteractionsChatbot,
  finishConversation,
  optionsSlider,
  setChatHistory,
  showOriginalInteractions,
  setFinishConversation,
  updateModelInputs,
  setIsGenerativeContext,
  allowPaste,
  modelInputs,
  chooseWhenTie,
  showChosenHistory,
}) => {
  const [prompt, setPrompt] = useState("");
  const [showSendButton, setShowSendButton] = useState(true);
  const [numInteractions, setNumInteractions] = useState(0);
  const [isAskingQuestion, setIsAskingQuestion] = useState(true);
  const [newResponses, setNewResponses] = useState<any[]>([]);
  const { post, response, loading } = useFetch();
  const [responsesHistory, setResponsesHistory] = useState<
    { iteration: number; responses_model: any[] }[]
  >([]);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [badReason, setBadReason] = useState("");
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(
    null
  );
  const [currentSelection, setCurrentSelection] = useState<string | null>(null);
  const { t } = useTranslation();

  // If optionsSlider does not exist always put isAskingQuestion to false
  // useEffect(() => {
  //   if (!optionsSlider) {
  //     setIsAskingQuestion(false);
  //   }
  // }, [optionsSlider]);

  const generateId = (): string => {
    return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

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
                id:
                  chatHistory.bot.length > 0
                    ? chatHistory.bot[chatHistory.bot.length - 1].id + 1
                    : 1,
                text: prompt,
              },
            ],
          },
          model_name: modelName,
          provider: provider,
          prompt: prompt,
          num_answers: numOfSamplesChatbot,
        }
      );
      if (response.ok) {
        const noAnswers = await checkNotAnswers(generatedTexts);
        if (noAnswers) {
          Swal.fire({
            title: "It seems like the model you selected went down.",
            text: "Please try again",
            icon: "error",
          }).then(() => {
            // window.location.reload();
          });
        }
        const generationId = generateId();
        setNewResponses(
          generatedTexts.map((text: any, index: number) => ({
            ...text,
            score: 50,
            generationId: generationId,
            originalPosition: index + 1,
          })) as any
        );
        setCurrentGenerationId(generationId);
        setCurrentSelection(null);
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

  const checkNotAnswers = async (generatedTexts: any) => {
    // check if in some of the texts the provider name is None, in that case return True
    const notAnswers = generatedTexts.every(
      (text: any) => text.text === "None"
    );
    const allTheAnswersAreEmpty = generatedTexts.every(
      (text: any) => text.text === "\n"
    );
    return notAnswers || allTheAnswersAreEmpty;
  };

  const finishSection = () => {
    updateModelInputs({
      chat_history: chatHistory,
    });
    setIsAskingQuestion(false);
  };

  const saveHistory = (option: string | null = null) => {
    const reduceText = newResponses.reduce(
      (max: { score: number }, answer: { score: number }) =>
        answer.score > max.score ? answer : max
    );

    const choosenText = option
      ? newResponses.find((text) => text.id === parseInt(option))
      : reduceText;
    const secondaryText = newResponses.filter(
      (text) => text.id !== choosenText?.id
    );

    setChatHistory({
      ...chatHistory,
      user: [
        ...chatHistory.user,
        {
          id: chatHistory.user.length
            ? chatHistory.user[chatHistory.user.length - 1].id + 1
            : 1,
          text: prompt,
        },
      ],
      bot: [
        ...chatHistory.bot,
        {
          id:
            chatHistory.bot.length > 0
              ? chatHistory.bot[chatHistory.bot.length - 1].id + 1
              : 1,
          text: choosenText.text,
          score: choosenText.score,
          originalPosition: choosenText.originalPosition,
          other_texts: secondaryText,
        },
      ],
    });
    setNewResponses([]);
    setIsAskingQuestion(true);
    setPrompt("");
    setNumInteractions((prev) => prev + 1);
    setResponsesHistory((prevResponses) => [
      ...prevResponses,
      {
        iteration: numInteractions,
        responses_model: newResponses,
        chosen_text: choosenText,
      },
    ]);
    updateModelInputs({
      historical_responses_model: [
        ...responsesHistory,
        {
          iteration: numInteractions,
          responses_model: newResponses,
          chosen_text: choosenText,
        },
      ],
    });
  };

  const handleOnClick = (option: string) => {
    if (currentSelection === option) {
      return;
    }

    setCurrentSelection(option);
    if (option === "tie") {
      setNewResponses(
        newResponses.map((text: any) => ({
          ...text,
          score: 50,
        }))
      );

      if (currentGenerationId) {
        const existingReasons = modelInputs.all_bad_reasons || [];
        const filteredReasons = existingReasons.filter(
          (reason: any) => reason.generation_id !== currentGenerationId
        );
        updateModelInputs({
          all_bad_reasons:
            filteredReasons.length > 0 ? filteredReasons : undefined,
        });
      }
    } else if (option === "all_bad") {
      setNewResponses(
        newResponses.map((text: any) => ({
          ...text,
          score: 0,
        }))
      );
      setShowReasonModal(true);
    } else {
      if (currentGenerationId) {
        const existingReasons = modelInputs.all_bad_reasons || [];
        const filteredReasons = existingReasons.filter(
          (reason: any) => reason.generation_id !== currentGenerationId
        );
        updateModelInputs({
          all_bad_reasons:
            filteredReasons.length > 0 ? filteredReasons : undefined,
        });
      }
    }
  };

  const checkIsTied = () => {
    if (newResponses.length <= 0) return false;

    const maxScore = Math.max(...newResponses.map((r) => r.score));
    const tiedResponses = newResponses.filter((r) => r.score === maxScore);
    return tiedResponses.length > 1;
  };

  const saveHistoryValidation = async () => {
    const isTied = checkIsTied();

    if (isTied && !chooseWhenTie) {
      Swal.fire({
        title: t("common:messages.tie"),
        text: t("common:messages.sureToContinue"),
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: t("common:buttons.yes"),
        cancelButtonText: t("common:buttons.no"),
      }).then((result: any) => {
        if (result.isConfirmed) {
          saveHistory();
        }
      });
    } else if (chooseWhenTie && isTied) {
      const inputOptions = newResponses.reduce(
        (options: { [key: string]: string }, text: any, index: number) => {
          options[text.id] = `Option #${text.id + 1}`;
          return options;
        },
        {}
      );
      const result = await Swal.fire({
        title: "Select an option to continue",
        input: "select",
        inputOptions: inputOptions,
        inputPlaceholder: "Select the option you want to continue with",
        inputValidator: (value) => {
          if (!value) {
            return "You need to select an option!";
          }
        },
      });
      if (result.isConfirmed && result.value) {
        saveHistory(result.value);
      }
    } else {
      saveHistory();
    }
  };

  const handleFinishInteraction = () => {
    showOriginalInteractions();
    setShowSendButton(false);
    finishSection();
    setIsGenerativeContext(false);
    // setFinishConversation(true);
  };

  const handleAllBadSubmit = () => {
    setNewResponses(
      newResponses.map((text: any) => ({
        ...text,
        score: 0,
      }))
    );
    const existingReasons = modelInputs.all_bad_reasons || [];
    updateModelInputs({
      all_bad_reasons: [
        ...existingReasons,
        {
          reason: badReason,
          timestamp: Date.now(),
          generation_id: currentGenerationId,
          texts_affected: newResponses.map((text) => {
            return {
              id: text.id,
              model: modelName,
              text: text.text,
            };
          }),
        },
      ],
    });
    setShowReasonModal(false);
    setBadReason("");
  };

  const handleReasonModalClose = () => {
    setShowReasonModal(false);
    setBadReason("");
  };

  return (
    <>
      {!loading ? (
        <>
          {
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
                              <span className="px-3 py-1 rounded-lg inline-block rounded-br-none bg-[#f0f2f5] text-white bg-third-color">
                                {message.text}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="chat-message">
                        <div
                          className={`flex ${
                            showChosenHistory ? "items-start" : "items-end"
                          } justify-end mt-3`}
                        >
                          {showChosenHistory ? (
                            <div className="flex flex-col items-end order-1 max-w-5xl w-full">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-2">
                                {chatHistory.bot[index].other_texts.length >
                                  0 &&
                                  chatHistory.bot[index].other_texts?.map(
                                    (text: any, i: number) => (
                                      <div
                                        key={`index${i}id${text.id}`}
                                        className={`w-full order-${
                                          text.originalPosition <= 12
                                            ? text.originalPosition
                                            : "last"
                                        }`}
                                      >
                                        <div className="relative p-3 bg-gray-100 border border-gray-200 rounded-lg">
                                          <textarea
                                            className="inline-block w-full px-3 py-2 text-letter-color rounded-lg rounded-bl-none"
                                            disabled={true}
                                            value={text.text}
                                            rows={5}
                                          />
                                        </div>
                                      </div>
                                    )
                                  )}
                                <div
                                  className={`w-full order-${
                                    chatHistory.bot[index].originalPosition <=
                                    12
                                      ? chatHistory.bot[index].originalPosition
                                      : "last"
                                  }`}
                                >
                                  <div className="relative p-1 bg-green-50 border-2 border-green-300 rounded-lg shadow-md">
                                    <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded font-semibold">
                                      ✓ Selected
                                    </div>
                                    <textarea
                                      className="w-full mt-6 p-2 text-letter-color bg-transparent border-0 resize-none focus:outline-none font-medium"
                                      disabled={true}
                                      value={chatHistory.bot[index].text}
                                      rows={5}
                                    />
                                  </div>
                                  <div className="flex justify-end mt-2">
                                    <img
                                      src="https://cdn-icons-png.flaticon.com/512/427/427995.png?w=1060&t=st=1687313158~exp=1687313758~hmac=a9f0bae6d29fe6f316f7fa531188e34fe0f562db16c7ea5fa53b3105bab66f6f"
                                      alt="My profile"
                                      className="rounded-full w-7 h-7"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end order-1 mx-2 max-w-lg">
                              <div className="min-w-[16rem] md:min-w-[26rem] lg:min-w-[32rem]">
                                <textarea
                                  className="inline-block w-full px-3 py-2 text-letter-color rounded-lg rounded-bl-none"
                                  disabled={true}
                                  value={chatHistory.bot[index].text}
                                  rows={5}
                                />
                              </div>
                              <div className="flex justify-end mt-2">
                                <img
                                  src="https://cdn-icons-png.flaticon.com/512/427/427995.png?w=1060&t=st=1687313158~exp=1687313758~hmac=a9f0bae6d29fe6f316f7fa531188e34fe0f562db16c7ea5fa53b3105bab66f6f"
                                  alt="My profile"
                                  className="order-2 rounded-full w-7 h-7"
                                />
                              </div>
                            </div>
                          )}
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
                          <span className="px-3 py-1 rounded-lg inline-block rounded-br-none bg-[#f0f2f5] text-letter-color text-white bg-third-color">
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
                      <BasicInputSeveralRows
                        placeholder="Enter text here. Do not copy and paste"
                        onChange={(e) => setPrompt(e.target.value)}
                        onEnter={askQuestion}
                        allowPaste={allowPaste}
                      />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 pt-8">
                  {newResponses &&
                    newResponses.map((response, key) => (
                      <EvaluateText
                        key={key}
                        name={response.model_letter}
                        text={response.text}
                        id={response.id}
                        texts={newResponses}
                        setTexts={setNewResponses}
                        optionsSlider={optionsSlider}
                        score={response.score}
                        handleWhenButtons={handleOnClick}
                      />
                    ))}
                  {newResponses.length > 0 && !optionsSlider && (
                    <div className="flex justify-end">
                      <GeneralButton
                        onClick={() => handleOnClick("tie")}
                        text={"It's a tie 🤝"}
                        className="border-0 font-weight-bold light-gray-bg task-action-btn"
                        active={currentSelection === "tie"}
                      />
                    </div>
                  )}
                  {newResponses.length > 0 && !optionsSlider && (
                    <div>
                      <GeneralButton
                        onClick={() => handleOnClick("all_bad")}
                        text={"All are bad 🚫"}
                        className="border-0 font-weight-bold light-gray-bg task-action-btn"
                        active={currentSelection === "all_bad"}
                      />
                    </div>
                  )}
                </div>
                {showReasonModal && (
                  <Modal
                    show={showReasonModal}
                    onHide={handleReasonModalClose}
                    size="lg"
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>Why are all answers bad?</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <div className="mb-3">
                        <label htmlFor="reasonTextarea" className="form-label">
                          Please explain why you think all the generated answers
                          are inadequate:
                        </label>
                        <textarea
                          id="reasonTextarea"
                          className="form-control"
                          rows={4}
                          value={badReason}
                          onChange={(e) => setBadReason(e.target.value)}
                          placeholder="Enter your reason here..."
                        />
                      </div>
                    </Modal.Body>
                    <Modal.Footer>
                      <GeneralButton
                        onClick={handleReasonModalClose}
                        text="Cancel"
                        className="border-0 font-weight-bold btn-secondary"
                      />
                      <GeneralButton
                        onClick={handleAllBadSubmit}
                        text="Submit"
                        className="border-0 font-weight-bold light-gray-bg task-action-btn"
                      />
                    </Modal.Footer>
                  </Modal>
                )}
                <div className="flex justify-end gap-2 ">
                  {isAskingQuestion ? (
                    <>
                      <div>
                        <GeneralButton
                          onClick={askQuestion}
                          text="Send"
                          className="px-4 py-1 font-semibold border-0 font-weight-bold light-gray-bg task-action-btn "
                        />
                      </div>
                      {numInteractions >= numInteractionsChatbot && (
                        <div>
                          <GeneralButton
                            onClick={handleFinishInteraction}
                            text="Finish"
                            className="px-4 py-1 font-semibold border-0 font-weight-bold light-gray-bg task-action-btn"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      {showSendButton && (
                        <GeneralButton
                          onClick={saveHistoryValidation}
                          text="Save"
                          className="px-4 py-1 font-semibold border-0 font-weight-bold light-gray-bg task-action-btn "
                          disabled={!currentSelection && !optionsSlider}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          }
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
