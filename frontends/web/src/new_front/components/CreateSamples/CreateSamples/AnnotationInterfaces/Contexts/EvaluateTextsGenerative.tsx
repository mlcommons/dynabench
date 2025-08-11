import React, { FC, useContext, useEffect, useState } from "react";
import Swal from "sweetalert2";
import useFetch from "use-http";
import Modal from "react-bootstrap/Modal";
import parse from "html-react-parser";
import { useTranslation } from "react-i18next";
import { PacmanLoader } from "react-spinners";

import UserContext from "containers/UserContext";
import GeneralButton from "new_front/components/Buttons/GeneralButton";
import Chatbot from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/Contexts/Chatbot";
import BasicInput from "new_front/components/Inputs/BasicInput";
import EvaluateText from "new_front/components/Inputs/EvaluateText";
import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import AnnotationUserInputStrategy from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/UserInput/AnnotationUserInputStrategy";
import SignContract from "new_front/components/Modals/SignContract";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { ChatHistoryType } from "new_front/types/createSamples/createSamples/utils";

const EvaluateTextsGenerative: FC<
  ContextAnnotationFactoryType & ContextConfigType
> = ({
  field_names_for_the_model,
  generative_context,
  instruction,
  contextId,
  taskId,
  setIsGenerativeContext,
  realRoundId,
}) => {
  const [signInConsent, setSignInConsent] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [showCategory, setShowCategory] = useState(false);
  const [finishConversation, setFinishConversation] = useState(false);
  const [disabledInput, setDisabledInput] = useState(false);
  const [disableTypeOfConversation, setDisableTypeOfConversation] =
    useState(false);
  const [bestAnswer, setBestAnswer] = useState<any>({});
  const [texts, setTexts] = useState<any[]>([]);

  const [chatHistory, setChatHistory] = useState<ChatHistoryType>({
    user: [],
    bot: [],
  });
  const [showChatbot, setShowChatbot] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [isCreatingTexts, setIsCreatingTexts] = useState(false);
  const [isTied, setIsTied] = useState(true);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [badReason, setBadReason] = useState("");
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(
    null
  );
  const [currentSelection, setCurrentSelection] = useState<string | null>(null);
  const [artifactsInput, setArtifactsInput] = useState<any>(
    generative_context.artifacts
  );
  const [prompt, setPrompt] = useState(
    "Enter text here. Do not copy and paste"
  );
  const { post, response } = useFetch();
  const { user } = useContext(UserContext);
  const { metadataExample, modelInputs, updateModelInputs } = useContext(
    CreateInterfaceContext
  );
  const neccessaryFields = ["original_prompt", "category"];
  const { t } = useTranslation();

  const checkIfUserIsSignedInConsent = async () => {
    const signConsent = await post("/task/check_signed_consent", {
      user_id: user.id,
      task_id: taskId,
    });
    if (response.ok) {
      setSignInConsent(signConsent);
    }
    setShowLoader(false);
  };

  const checkIfUserReachedNecessaryExamples = async () => {
    const redirectUrl = await post(
      "/rounduserexample/redirect_to_third_party_provider",
      {
        task_id: taskId,
        user_id: user.id,
        round_id: realRoundId,
      }
    );
    if (response.ok) {
      if (redirectUrl) {
        Swal.fire({
          title: "You have reached the necessary examples",
          text: "You will be redirected to the third party provider",
          icon: "success",
          confirmButtonText: "Ok",
        }).then(() => {
          window.location.href = redirectUrl;
        });
      }
    }
  };

  const generateId = (): string => {
    return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const generateTexts = async () => {
    if (neccessaryFields.every((item) => modelInputs.hasOwnProperty(item))) {
      setIsCreatingTexts(true);
      setDisableTypeOfConversation(true);
      // This unique ID is used to track the generation process
      const generationId = generateId();
      setCurrentGenerationId(generationId);
      const generatedTexts = await post("/context/get_generative_contexts", {
        type: generative_context.type,
        artifacts: artifactsInput,
      });
      if (response.ok) {
        const noAnswers = await checkNotAnswers(generatedTexts);
        if (noAnswers) {
          Swal.fire({
            title: "The models could not generate any answer at this moment.",
            text: "Please try again",
            icon: "error",
          });
          window.location.reload();
        }
        setTexts(
          generatedTexts.map((text: any) => ({
            ...text,
            score: 50,
            generationId: generationId,
          }))
        );
        updateModelInputs({
          [field_names_for_the_model.generated_answers ?? "generated_answers"]:
            generatedTexts,
        });
        setIsCreatingTexts(false);
      } else {
        setIsCreatingTexts(false);
        Swal.fire({
          title: "Something went wrong",
          icon: "error",
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
      setShowAnswers(true);
      setDisabledInput(true);
    } else {
      Swal.fire({
        title: "Please fill in all the fields",
        icon: "error",
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

  const checkIsTied = () => {
    if (texts.length <= 1) {
      setIsTied(false);
      return;
    }
    const maxScore = Math.max(...texts.map((text) => text.score));

    const textsWithMaxScore = texts.filter((text) => text.score === maxScore);
    const isTied = textsWithMaxScore.length > 1;
    setIsTied(isTied);
  };

  const checkNotAnswers = async (generatedTexts: any) => {
    // check if in some of the texts the provider name is None, in that case return True
    const notAnswers = generatedTexts.every(
      (text: any) => text.provider === "None"
    );
    const allTheAnswersAreEmpty = generatedTexts.every(
      (text: any) => text.text === "\n"
    );
    return notAnswers || allTheAnswersAreEmpty;
  };

  const handleSaveText = (option: string | null = null) => {
    const reducedText = texts.reduce(
      (max: { score: number }, answer: { score: number }) =>
        answer.score > max.score ? answer : max
    );
    if (!option) {
      updateModelInputs({
        [field_names_for_the_model.best_answer ?? "best_answer"]: reducedText,
      });
      setBestAnswer(reducedText);
    } else {
      const selectedText = texts.find((text) => text.id === parseInt(option));
      if (selectedText) {
        updateModelInputs({
          [field_names_for_the_model.best_answer ?? "best_answer"]:
            selectedText,
        });
        setBestAnswer(selectedText);
      }
    }

    const chosenText = option
      ? texts.find((text) => text.id === parseInt(option))
      : reducedText;
    const secondaryTexts = texts.filter((text) => text.id !== chosenText?.id);

    setChatHistory({
      ...chatHistory,
      bot: [
        ...chatHistory.bot,
        {
          id: "1",
          text: chosenText.text,
          other_texts: secondaryTexts,
        },
      ],
    });
    setShowChatbot(true);
    setShowAnswers(false);
    setShowInput(false);
  };

  const handleSelectedText = async () => {
    if (
      isTied &&
      !("choose_when_tie" in artifactsInput) &&
      !artifactsInput?.choose_when_tie
    ) {
      Swal.fire({
        title: t("common:messages.tie"),
        text: t("common:messages.sureToContinue"),
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: t("common:buttons.yes"),
        cancelButtonText: t("common:buttons.no"),
      }).then((result: any) => {
        if (result.isConfirmed) {
          handleSaveText();
        }
      });
    } else if (artifactsInput?.choose_when_tie && isTied) {
      const inputOptions = texts.reduce(
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
        handleSaveText(result.value);
      }
    } else {
      handleSaveText();
    }
  };

  const handleSignInConsent = async () => {
    await post("/task/sign_in_consent", {
      user_id: user.id,
      task_id: taskId,
    });
    setSignInConsent(true);
    window.location.reload();
  };

  const showOriginalInteractions = () => {
    setShowAnswers(true);
    setShowInput(true);
  };

  useEffect(() => {
    const initializeComponent = async () => {
      checkIfUserReachedNecessaryExamples();
      if ("show_category" in artifactsInput) {
        setShowCategory(artifactsInput?.show_category);
        let category = "Unguided";
        if ("default_category" in artifactsInput) {
          category = artifactsInput?.default_category;
        }
        updateModelInputs({
          category: category,
        });
        updateModelInputs({
          initial_timestamp: Date.now(),
        });
        setShowInput(true);
      } else {
        setShowCategory(true);
      }

      if (!("need_consent" in artifactsInput) || artifactsInput.need_consent) {
        checkIfUserIsSignedInConsent();
      } else {
        setShowLoader(false);
        setSignInConsent(true);
      }
    };
    initializeComponent();
  }, []);

  useEffect(() => {
    updateModelInputs({
      [field_names_for_the_model.generated_answers ?? "generated_answers"]:
        texts,
    });
    checkIsTied();
  }, [texts]);

  useEffect(() => {
    if (modelInputs) {
      console.log("modelInputs", modelInputs);
    }
    if (metadataExample) {
      console.log("metadataExample", metadataExample);
    }
    if (
      artifactsInput?.user_input &&
      artifactsInput?.user_input?.field_name_for_the_model in modelInputs &&
      !("initial_timestamp" in modelInputs) &&
      !showInput
    ) {
      setShowCategory(true);
      setShowInput(true);
      updateModelInputs({
        initial_timestamp: Date.now(),
      });
    }
  }, [modelInputs, texts, metadataExample]);

  const handleOnClick = (option: string) => {
    if (currentSelection === option) {
      return;
    }

    setCurrentSelection(option);

    if (option === "tie") {
      setTexts(
        texts.map((text: any) => ({
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
      setTexts(
        texts.map((text: any) => ({
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

  const handleAllBadSubmit = () => {
    setTexts(
      texts.map((text: any) => ({
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
          texts_affected: texts.map((text) => {
            const provider = text.provider || "Unknown Provider";
            return {
              id: text.id,
              model: text.model_name[provider].model_name,
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
      {!showLoader ? (
        <>
          {signInConsent ? (
            <div>
              <div>
                {showCategory && (
                  <div>
                    <AnnotationUserInputStrategy
                      config={[artifactsInput.user_input]}
                      isGenerativeContext={false}
                    />
                  </div>
                )}
                {showInput && (
                  <>
                    {finishConversation && !isCreatingTexts ? (
                      <h4 className="pb-3 pl-2 text-lg font-semibold text-letter-color">
                        {parse(artifactsInput.finish_instruction)}
                      </h4>
                    ) : (
                      <h4 className="pb-3 pl-2 text-lg font-semibold text-letter-color">
                        {parse(artifactsInput.general_instruction)}
                      </h4>
                    )}
                    {!isCreatingTexts ? (
                      <div>
                        <AnnotationInstruction
                          placement="left"
                          tooltip={
                            instruction.prompt ||
                            t("tasks:annotation.selectText")
                          }
                        >
                          <BasicInput
                            onChange={handlePromptChange}
                            onEnter={generateTexts}
                            placeholder={prompt}
                            disabled={disabledInput}
                          />
                        </AnnotationInstruction>
                      </div>
                    ) : (
                      <div className="grid items-center justify-center grid-rows-2">
                        <div className="mr-2 text-letter-color">
                          {t("common:messages.bearModels")}
                        </div>
                        <PacmanLoader
                          color="#ccebd4"
                          loading={isCreatingTexts}
                          size={50}
                          className="align-center"
                        />
                      </div>
                    )}
                    {!finishConversation &&
                      !isCreatingTexts &&
                      !disabledInput && (
                        <div className="grid col-span-1 py-3 justify-items-end">
                          <AnnotationInstruction
                            placement="top"
                            tooltip={
                              instruction.generate_button ||
                              "Select one of the options below"
                            }
                          >
                            <GeneralButton
                              onClick={generateTexts}
                              text={t("common:buttons.send")}
                              className="border-0 font-weight-bold light-gray-bg task-action-btn"
                              disabled={disabledInput}
                            />
                          </AnnotationInstruction>
                        </div>
                      )}
                  </>
                )}
              </div>
              {showAnswers && (
                <>
                  {!finishConversation && (
                    <h4 className="pt-4 pb-3 pl-2 text-lg font-semibold text-letter-color">
                      {artifactsInput.general_instruction_multiple_models}
                    </h4>
                  )}
                  {!isCreatingTexts && (
                    <div className="grid grid-cols-2 gap-6 pt-2">
                      {texts.map((text) => (
                        <EvaluateText
                          key={text.id}
                          name={text.model_letter}
                          text={text.text}
                          id={text.id}
                          texts={texts}
                          setTexts={setTexts}
                          optionsSlider={artifactsInput.options_slider}
                          disabled={finishConversation}
                          bestAnswer={bestAnswer.text}
                          score={text.score}
                          handleWhenButtons={handleOnClick}
                        />
                      ))}
                      {!artifactsInput?.options_slider && (
                        <div className="flex justify-end">
                          <GeneralButton
                            onClick={() => handleOnClick("tie")}
                            text={"It's a tie 🤝"}
                            className="border-0 font-weight-bold light-gray-bg task-action-btn"
                            active={currentSelection === "tie"}
                            disabled={finishConversation}
                          />
                        </div>
                      )}
                      {!artifactsInput?.options_slider && (
                        <div>
                          <GeneralButton
                            onClick={() => handleOnClick("all_bad")}
                            text={"All are bad 🚫"}
                            className="border-0 font-weight-bold light-gray-bg task-action-btn"
                            active={currentSelection === "all_bad"}
                            disabled={finishConversation}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {!finishConversation &&
                    Object.keys(bestAnswer).length === 0 && (
                      <div className="grid col-span-1 py-3 justify-items-end">
                        <GeneralButton
                          onClick={handleSelectedText}
                          text={t("common:buttons.send_rating")}
                          className="border-0 font-weight-bold light-gray-bg task-action-btn"
                          disabled={
                            !currentSelection && !artifactsInput?.options_slider
                          }
                        />
                      </div>
                    )}
                </>
              )}
              {showChatbot && (
                <Chatbot
                  instructions={artifactsInput.general_instruction_chatbot}
                  chatHistory={chatHistory}
                  username={user.username}
                  modelName={bestAnswer.model_name}
                  provider={bestAnswer.provider}
                  numOfSamplesChatbot={artifactsInput.num_of_samples_chatbot}
                  numInteractionsChatbot={
                    artifactsInput.num_interactions_chatbot
                  }
                  finishConversation={finishConversation}
                  optionsSlider={artifactsInput.options_slider}
                  setChatHistory={setChatHistory}
                  showOriginalInteractions={showOriginalInteractions}
                  setFinishConversation={setFinishConversation}
                  updateModelInputs={updateModelInputs}
                  setIsGenerativeContext={setIsGenerativeContext}
                  modelInputs={modelInputs}
                  chooseWhenTie={
                    "choose_when_tie" in artifactsInput &&
                    artifactsInput?.choose_when_tie
                  }
                  showChosenHistory={
                    "show_chosen_history" in artifactsInput &&
                    artifactsInput?.show_chosen_history
                  }
                />
              )}
            </div>
          ) : (
            <Modal show={true} onHide={() => setSignInConsent} size="lg">
              <SignContract handleClose={handleSignInConsent} />
            </Modal>
          )}
        </>
      ) : (
        <div className="grid items-center justify-center grid-rows-2">
          <PacmanLoader
            color="#ccebd4"
            loading={showLoader}
            size={50}
            className="align-center"
          />
        </div>
      )}
      {showReasonModal && (
        <Modal show={showReasonModal} onHide={handleReasonModalClose} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Why are all answers bad?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <label htmlFor="reasonTextarea" className="form-label">
                Please explain why you think all the generated answers are
                inadequate:
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
    </>
  );
};

export default EvaluateTextsGenerative;
