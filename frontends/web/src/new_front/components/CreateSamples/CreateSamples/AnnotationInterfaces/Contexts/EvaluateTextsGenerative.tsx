import UserContext from "containers/UserContext";
import GeneralButton from "new_front/components/Buttons/GeneralButton";
import Chatbot from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/Contexts/Chatbot";
import BasicInput from "new_front/components/Inputs/BasicInput";
import EvaluateText from "new_front/components/Inputs/EvaluateText";
import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { ChatHistoryType } from "new_front/types/createSamples/createSamples/utils";
import React, { FC, useContext, useEffect, useState } from "react";
import { PacmanLoader } from "react-spinners";
import Swal from "sweetalert2";
import useFetch from "use-http";
import SignContract from "new_front/components/Modals/SignContract";
import Modal from "react-bootstrap/Modal";
import RadioButton from "new_front/components/Lists/RadioButton";
import parse from "html-react-parser";

const EvaluateTextsGenerative: FC<
  ContextAnnotationFactoryType & ContextConfigType
> = ({
  field_names_for_the_model,
  generative_context,
  instruction,
  contextId,
  taskId,
  setIsGenerativeContext,
}) => {
  const [signInConsent, setSignInConsent] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [showCategory, setShowCategory] = useState(true);
  const [finishConversation, setFinishConversation] = useState(false);
  const [disabledInput, setDisabledInput] = useState(false);
  const [bestAnswer, setBestAnswer] = useState<any>({});
  const [texts, setTexts] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryType>({
    user: [],
    bot: [],
  });
  const [showChatbot, setShowChatbot] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [isTied, setIsTied] = useState(true);
  const [artifactsInput, setArtifactsInput] = useState<any>(
    generative_context.artifacts,
  );
  const [prompt, setPrompt] = useState(
    "Enter text here. Do not copy and paste",
  );
  const { post, response } = useFetch();
  const { user } = useContext(UserContext);
  const { metadataExample, modelInputs, updateModelInputs } = useContext(
    CreateInterfaceContext,
  );
  const neccessaryFields = ["original_prompt", "category"];

  const handleSaveCategory = async (category: string) => {
    updateModelInputs({
      category: category,
    });
    setShowInput(true);
    setShowCategory(true);
  };

  const checkIfUserIsSignedInConsent = async () => {
    const signConsent = await post("/task/check_sign_consent", {
      user_id: user.id,
      task_id: taskId,
    });
    if (response.ok) {
      setSignInConsent(signConsent);
    }
  };

  const generateTexts = async () => {
    if (neccessaryFields.every((item) => modelInputs.hasOwnProperty(item))) {
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
        setShowLoader(false);
      } else {
        setShowLoader(false);
        Swal.fire({
          title: "Something went wrong",
          icon: "error",
        });
      }

      // const generatedTexts = [
      //   {
      //     id: "1",
      //     model_name: "GPT-3",
      //     provider: "openai",
      //     text: "The secret of life is a philosophical and existential question that has been contemplated by humans for centuries. It is a deeply personal and subjective topic, and different individuals may have different perspectives and beliefs regarding the meaning and purpose of life.",
      //   },
      //   {
      //     id: "2",
      //     model_name: "text-davinci-003",
      //     provider: "openai",
      //     text: "Good and you?",
      //   },
      //   {
      //     id: "3",
      //     model_name: "GPT-1",
      //     provider: "openai",
      //     text: "The secret of life is a profound and existential question that has been contemplated by humans for centuries. It is a deeply personal and subjective topic, and different individuals may have different perspectives and beliefs regarding the meaning and purpose of life.",
      //   },
      //   {
      //     id: "4",
      //     model_name: "GPT-4",
      //     provider: "openai",
      //     text: "Ultimately, the secret of life may be found in the journey of self-reflection, introspection, and living in alignment with one's values and authentic self. It is an ongoing process of seeking purpose, finding joy and fulfillment, and embracing the experiences and lessons that life offers.",
      //   },
      // ];

      setTexts(
        generatedTexts.map((text: any) => ({
          ...text,
          score: 50,
        })),
      );

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
    const isTied = texts.every(
      (text) => text.score === texts[0].score && texts.length > 1,
    );
    setIsTied(isTied);
  };

  const handleSelectedText = () => {
    if (isTied) {
      Swal.fire({
        title: "Rate at least one of the answers",
        icon: "error",
      });
    }
    if (!isTied) {
      updateModelInputs({
        [field_names_for_the_model.best_answer ?? "best_answer"]: texts.reduce(
          (max: { score: number }, answer: { score: number }) =>
            answer.score > max.score ? answer : max,
        ),
      });
      setBestAnswer(
        texts.reduce((max: { score: number }, answer: { score: number }) =>
          answer.score > max.score ? answer : max,
        ),
      );

      setChatHistory({
        ...chatHistory,
        bot: [
          ...chatHistory.bot,
          {
            id: "1",
            text: texts.reduce(
              (max: { score: number }, answer: { score: number }) =>
                answer.score > max.score ? answer : max,
            ).text,
          },
        ],
      });
      setShowChatbot(true);
      setShowAnswers(false);
      setShowInput(false);
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
  }, [modelInputs, texts, metadataExample]);

  useEffect(() => {
    checkIfUserIsSignedInConsent();
  }, [signInConsent]);

  return (
    <>
      {!showLoader ? (
        <>
          {signInConsent ? (
            <div>
              <div>
                {showCategory && (
                  <div>
                    <AnnotationInstruction
                      placement="left"
                      tooltip={artifactsInput.user_input.instruction}
                    >
                      <RadioButton
                        instructions={artifactsInput.user_input.instructions}
                        options={artifactsInput.user_input.options}
                        field_name_for_the_model={
                          artifactsInput.user_input.field_name_for_the_model
                        }
                        onInputChange={handleSaveCategory}
                        disabled={disabledInput}
                      />
                    </AnnotationInstruction>
                  </div>
                )}
                {showInput && (
                  <>
                    {finishConversation ? (
                      <h4 className="pb-3 pl-2 text-lg font-semibold text-letter-color">
                        {parse(artifactsInput.finish_instruction)}
                      </h4>
                    ) : (
                      <h4 className="pb-3 pl-2 text-lg font-semibold text-letter-color">
                        {parse(artifactsInput.general_instruction)}
                      </h4>
                    )}
                    <div>
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
                          disabled={disabledInput}
                        />
                      </AnnotationInstruction>
                    </div>

                    {!finishConversation && (
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
                            text="Send"
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
                    <h4 className="pb-3 pl-2 text-lg font-semibold text-letter-color">
                      {artifactsInput.general_instruction_multiple_models}
                    </h4>
                  )}
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
                      />
                    ))}
                  </div>
                  {!finishConversation && (
                    <div className="grid col-span-1 py-3 justify-items-end">
                      <GeneralButton
                        onClick={handleSelectedText}
                        text="Send"
                        className="border-0 font-weight-bold light-gray-bg task-action-btn"
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
                  model_name={bestAnswer.model_name}
                  provider={bestAnswer.provider}
                  num_of_samples_chatbot={artifactsInput.num_of_samples_chatbot}
                  num_interactions_chatbot={
                    artifactsInput.num_interactions_chatbot
                  }
                  finishConversation={finishConversation}
                  optionsSlider={artifactsInput.options_slider}
                  setChatHistory={setChatHistory}
                  showOriginalInteractions={showOriginalInteractions}
                  setFinishConversation={setFinishConversation}
                  updateModelInputs={updateModelInputs}
                  setIsGenerativeContext={setIsGenerativeContext}
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

export default EvaluateTextsGenerative;
