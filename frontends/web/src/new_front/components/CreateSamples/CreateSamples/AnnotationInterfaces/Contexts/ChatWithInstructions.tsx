import React, { FC, useContext, useEffect, useState } from "react";
import SignContractHelpMe from "new_front/components/Modals/SignContractHelpMe";
import Chatbot from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/Contexts/Chatbot";
import useFetch from "use-http";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import UserContext from "containers/UserContext";
import Modal from "react-bootstrap/Modal";
import { ChatHistoryType } from "new_front/types/createSamples/createSamples/utils";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import BasicInstructions from "new_front/components/Inputs/BasicInstructions";
import GeneralButton from "new_front/components/Buttons/GeneralButton";
import { useLocation } from "react-router-dom";
import queryString from "query-string";
import Swal from "sweetalert2";

enum TreatmentId {
  Llama = "1",
  GPT = "2",
  Control = "3",
}

const ChatWithInstructions: FC<
  ContextAnnotationFactoryType & ContextConfigType
> = ({
  taskId,
  generative_context,
  setIsGenerativeContext,
  context,
  realRoundId,
}) => {
  const [signInConsent, setSignInConsent] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryType>({
    user: [],
    bot: [],
  });
  const [modelName, setModelName] = useState({});
  const [provider, setProvider] = useState("");
  const [artifactsInput, setArtifactsInput] = useState<any>(
    generative_context.artifacts,
  );
  const [controlText, setControlText] = useState("");
  const [finishConversation, setFinishConversation] = useState(false);
  const [readInstructions, setReadInstructions] = useState(false);
  const { updateModelInputs } = useContext(CreateInterfaceContext);
  const [treatmentValue, setTreatmentValue] = useState("");
  const { post, response } = useFetch();
  const { user } = useContext(UserContext);
  const location = useLocation();
  const queryParams = queryString.parse(location.search);
  let treatmentId = queryParams.treatmentId;
  let prolificId = queryParams.assignmentId;

  function getTreatmentValue(treatmentId: TreatmentId): string {
    switch (treatmentId) {
      case TreatmentId.Llama:
        setProvider("huggingface_api");
        return "huggingface_api";
      case TreatmentId.GPT:
        setProvider("openaihm");
        return "openaihm";
      case TreatmentId.Control:
        return "control";
      default:
        throw new Error("Invalid treatment ID");
    }
  }

  const checkIfUserIsSignedInConsent = async () => {
    const signConsent = await post("/task/check_signed_consent", {
      user_id: user.id,
      task_id: taskId,
    });
    if (response.ok) {
      setSignInConsent(signConsent);
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

  const checkIfUserReachedNecessaryExamples = async () => {
    const redirectUrl = await post(
      "/rounduserexample/redirect_to_third_party_provider",
      {
        task_id: taskId,
        user_id: user.id,
        round_id: realRoundId,
        url: `https://oii.qualtrics.com/jfe/form/SV_3rt2Z0hbvyocuMu?prolific_id=${prolificId}`,
      },
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

  useEffect(() => {
    if (treatmentId) {
      setTreatmentValue(getTreatmentValue(treatmentId as TreatmentId));
      if (getTreatmentValue(treatmentId as TreatmentId) !== "control") {
        const modelConfig =
          // @ts-ignore
          generative_context.artifacts.providers[
            getTreatmentValue(treatmentId as TreatmentId)
          ][0];
        console.log("modelConfig", modelConfig);

        setModelName({
          [getTreatmentValue(treatmentId as TreatmentId)]: modelConfig,
        });
      }
    }
  }, [treatmentId]);

  useEffect(() => {
    checkIfUserIsSignedInConsent();
  }, [signInConsent]);

  useEffect(() => {
    checkIfUserReachedNecessaryExamples();
  }, []);

  return (
    <>
      {signInConsent ? (
        <>
          {!readInstructions ? (
            <div className="flex flex-col justify-center gap-8">
              <div
                id="general-instructions"
                className="p-4 bg-white border border-gray-200"
              >
                <div className="">
                  <h3 className="text-2xl font-bold">
                    General Instructions for all participants
                  </h3>
                  <p className="mb-3">
                    In this study, you will be asked to complete two different
                    scenarios which simulate healthcare scenarios that a person
                    might encounter in everyday life...
                  </p>
                  {treatmentValue !== "control" ? (
                    <>
                      <h3 className="mb-3 text-xl font-bold ">
                        Instructions for LLM treatments:
                      </h3>
                      <p className="">
                        The health scenario for this task is presented in the
                        right side panel. Please use the chatbot interface on
                        the left side to help you in deciding what to do in this
                        scenario...
                      </p>
                      <p className="mb-3">
                        The questions you will be asked are: 1) “What should you
                        do next?” with the options Treat at Home, Call your GP,
                        Call 111, and Call 999; and 2) “What is the most likely
                        cause of the problems being reported?” which is free
                        response.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="mb-3 text-xl font-bold ">
                        Instructions for control treatment:
                      </h3>
                      <p className="">
                        The health scenario for this task is presented in the
                        panel below. Please use any resource you would
                        ordinarily use to decide what to do in a health
                        scenario...
                      </p>
                      <p className="">
                        The questions you will be asked are: 1) “What should you
                        do next?” with the options Treat at Home, Call your GP,
                        Call 111, and Call 999; and 2) “What is the most likely
                        cause of the problems being reported?” which is free
                        response.
                      </p>
                    </>
                  )}
                </div>
              </div>
              {treatmentValue !== "control" && (
                <div
                  id="brief-instructions"
                  className="p-4 bg-white border border-gray-200"
                >
                  <h1 className="mb-4 text-2xl font-bold">
                    Brief Introduction to Large Language Models
                  </h1>
                  <p className="mb-4">
                    In this study, participants will interact with a large
                    language model to reach a decision about a healthcare
                    scenario.
                  </p>
                  <p className="mb-4">
                    Large language models (LLMs) are a recent technology in the
                    field of artificial intelligence which can generate text.
                    They often take the form of a chatbot, which holds
                    “conversations” with users by responding to written prompts.
                    The most famous example is ChatGPT.
                  </p>
                  <p className="mb-4">
                    The LLM used in this experiment also uses a chat interface.
                    You can type in sentences, such as questions about the
                    scenario, and the LLM will generate new text in response.
                    Your previous statements will be included as context, so
                    that each response reflects the whole conversation up to
                    that point.
                  </p>
                </div>
              )}
              <div className="px-4 py-2 border border-gray-200 ">
                <BasicInstructions instructions={context} />
              </div>
              <div className="flex items-end justify-end gap-4">
                <GeneralButton
                  text="I understand"
                  onClick={() => setReadInstructions(true)}
                  className="border-0 font-weight-bold light-gray-bg task-action-btn"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 divide-x-2">
              <div className="col-span-2">
                {treatmentValue !== "control" ? (
                  <Chatbot
                    instructions={artifactsInput.general_instruction_chatbot}
                    chatHistory={chatHistory}
                    username={user.username}
                    modelName={modelName}
                    provider={provider}
                    numOfSamplesChatbot={artifactsInput.num_of_samples_chatbot}
                    numInteractionsChatbot={
                      artifactsInput.num_interactions_chatbot
                    }
                    finishConversation={finishConversation}
                    setChatHistory={setChatHistory}
                    showOriginalInteractions={() => {}}
                    setFinishConversation={setFinishConversation}
                    updateModelInputs={updateModelInputs}
                    setIsGenerativeContext={setIsGenerativeContext}
                  />
                ) : (
                  <>
                    <p className="text-lg font-bold">
                      Now use the any methods you would ordinarily use at home
                      to determine the best response to the scenario. The
                      scenario details are available for reference below.
                    </p>
                    <textarea
                      className="w-full p-4 mt-4 border border-gray-200 h-96"
                      placeholder="Type your response here..."
                      onPaste={(e: any) => {
                        e.preventDefault();
                        return false;
                      }}
                      onCopy={(e: any) => {
                        e.preventDefault();
                        return false;
                      }}
                      onChange={(e) => setControlText(e.target.value)}
                    />
                    {controlText.length > 0 && (
                      <div className="flex justify-end">
                        <GeneralButton
                          className="px-4 mt-4 font-semibold border-0 font-weight-bold light-gray-bg task-action-btn"
                          text="Submit"
                          onClick={() => {
                            updateModelInputs({
                              controlText: controlText,
                            });
                            setIsGenerativeContext(false);
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="col-span-1">
                <div className="px-4 overflow-y-auto max-h-96">
                  <BasicInstructions instructions={context} />
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <Modal show={true} onHide={() => setSignInConsent} size="lg">
          <SignContractHelpMe handleClose={handleSignInConsent} />
        </Modal>
      )}
    </>
  );
};

export default ChatWithInstructions;
