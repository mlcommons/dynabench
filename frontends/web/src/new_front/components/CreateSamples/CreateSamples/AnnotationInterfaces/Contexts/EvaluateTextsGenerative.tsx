import UserContext from "containers/UserContext";
import GeneralButton from "new_front/components/Buttons/GeneralButton";
import Chatbot from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/Contexts/Chatbot";
import BasicInput from "new_front/components/Inputs/BasicInput";
import Dropdown from "new_front/components/Inputs/Dropdown";
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
import ExtraInfoChatbot from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/Contexts/ExtraInfoChatbot";

const EvaluateTextsGenerative: FC<
  ContextAnnotationFactoryType & ContextConfigType
> = ({
  field_names_for_the_model,
  generative_context,
  instruction,
  contextId,
}) => {
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [bestAnswer, setBestAnswer] = useState<any>({});
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
  const neccessaryFields = ["original_prompt", "category"];

  const handleSaveCategory = async (category: string) => {
    updateModelInputs({
      category: category,
    });
    setCategoryPrompt(category);
  };

  const generateTexts = async () => {
    if (neccessaryFields.every((item) => modelInputs.hasOwnProperty(item))) {
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

      setShowLoader(true);
      // const generatedTexts = [
      //   {
      //     id: '1',
      //     model_name: 'GPT-3',
      //     provider: 'openai',
      //     model_letter: 'A',
      //     text:
      //       'The secret of life is a philosophical and existential question that has been contemplated by humans for centuries. It is a deeply personal and subjective topic, and different individuals may have different perspectives and beliefs regarding the meaning and purpose of life.',
      //     score: 50,
      //   },
      //   {
      //     id: '2',
      //     model_name: 'text-davinci-003',
      //     provider: 'openai',
      //     text: 'Good and you?',
      //     model_letter: 'B',
      //     score: 50,
      //   },
      //   {
      //     id: '3',
      //     model_name: 'GPT-1',
      //     provider: 'openai',
      //     model_letter: 'C',
      //     text:
      //       'The secret of life is a profound and existential question that has been contemplated by humans for centuries. It is a deeply personal and subjective topic, and different individuals may have different perspectives and beliefs regarding the meaning and purpose of life.',
      //     score: 50,
      //   },
      //   {
      //     id: '4',
      //     model_name: 'GPT-4',
      //     provider: 'openai',
      //     model_letter: 'D',
      //     text:
      //       "Ultimately, the secret of life may be found in the journey of self-reflection, introspection, and living in alignment with one's values and authentic self. It is an ongoing process of seeking purpose, finding joy and fulfillment, and embracing the experiences and lessons that life offers.",
      //     score: 50,
      //   },
      // ]
      // setTexts(generatedTexts)

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

  const handleSelectedText = () => {
    updateModelInputs({
      [field_names_for_the_model.best_answer ?? "best_answer"]: texts.reduce(
        (max: { score: number }, answer: { score: number }) =>
          answer.score > max.score ? answer : max
      ),
    });
    setBestAnswer(
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
            <div className="grid w-full grid-cols-3 gap-6">
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
              <div className="z-40 col-span-1">
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
                className="border-0 font-weight-bold light-gray-bg task-action-btn"
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
                  className="border-0 font-weight-bold light-gray-bg task-action-btn"
                />
              </div>
            </>
          )}
          {showChatbot && (
            <Chatbot
              chatHistory={chatHistory}
              model_name={bestAnswer.model_name}
              provider={bestAnswer.provider}
              setChatHistory={setChatHistory}
              setShowExtraInfo={setShowExtraInfo}
              updateModelInputs={updateModelInputs}
            />
          )}
          {showExtraInfo && (
            <ExtraInfoChatbot
              bestAnswer={bestAnswer}
              contextId={contextId}
              userId={user.id!}
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

export default EvaluateTextsGenerative;
