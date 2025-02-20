import React, { FC, useContext, useEffect, useState, useCallback } from "react";
import { useLocation, useHistory } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import Modal from "react-bootstrap/Modal";
import queryString from "query-string";
import useFetch from "use-http";
import Swal from "sweetalert2";
import parse from "html-react-parser";

import UserContext from "containers/UserContext";

import SignConsent from "new_front/components/Modals/SignConsent";
import Chatbot from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/Contexts/Chatbot";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ChatHistoryType } from "new_front/types/createSamples/createSamples/utils";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import BasicInstructions from "new_front/components/Inputs/BasicInstructions";
import GeneralButton from "new_front/components/Buttons/GeneralButton";

const ChatWithInstructions: FC<
  ContextAnnotationFactoryType & ContextConfigType
> = ({
  taskId,
  generative_context,
  setIsGenerativeContext,
  context,
  realRoundId,
}) => {
  const artifactsInput = generative_context.artifacts;
  const [signInConsent, setSignInConsent] = useState(true);
  const [callLoading, setCallLoading] = useState(true);
  const [showExample, setShowExample] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryType>({
    user: [],
    bot: [],
  });
  const [modelName, setModelName] = useState({});
  const [provider, setProvider] = useState("");
  const [newContext, setNewContext] = useState<any>();
  const [agreeText, setAgreeText] = useState(null);
  const [consentTerms, setConsentTerms] = useState(null);
  const [finishConversation, setFinishConversation] = useState(false);
  const [readInstructions, setReadInstructions] = useState(
    artifactsInput?.jump_instructions ? true : false
  );
  const { updateModelInputs } = useContext(CreateInterfaceContext);
  const [example, setExample] = useState("");
  const { get, post, response, loading } = useFetch();
  const { user } = useContext(UserContext);
  const location = useLocation();
  const history = useHistory();

  const queryParams = queryString.parse(location.search);

  const bringConsentTerms = useCallback(async () => {
    await get(`/task/get_task_consent?task_id=${taskId}`);
    if (response.ok) {
      setConsentTerms(response.data.consent_text);
      setAgreeText(response.data.agree_text);
      setCallLoading(false);
    }
  }, [taskId, get]);

  const checkIfUserIsSignedInConsent = useCallback(async () => {
    const signConsent = await post("/task/check_signed_consent", {
      user_id: user.id,
      task_id: taskId,
    });
    if (response.ok) {
      signConsent && setCallLoading(false);
      setSignInConsent(signConsent);
      !signConsent && bringConsentTerms();
    }
  }, [user.id, taskId, bringConsentTerms, post]);

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
      }
    );
    if (response.ok) {
      if (redirectUrl) {
        Swal.fire({
          title: "You have reached the necessary examples",
          text: "You will be redirected to the post-survey.",
          icon: "success",
          confirmButtonText: "Ok",
        }).then(() => {
          window.location.href = redirectUrl;
        });
      }
    }
  };

  const bringDistinctContextAndModelInfo = async () => {
    try {
      const [contextResponse, modelResponse] = await Promise.all([
        get(
          `/context/get_distinct_context?user_id=${user.id}&round_id=${realRoundId}`
        ),
        get(`/task/get_random_provider_and_model_info?task_id=${taskId}`),
      ]);
      if (response.ok) {
        if (!contextResponse.context || !modelResponse.provider) {
          Swal.fire({
            title: !contextResponse.context
              ? "No more tasks"
              : "No models or providers",
            text: !contextResponse.context
              ? "You have no more task to complete in this round"
              : "There are no models or providers available for this task",
            icon: !contextResponse.context ? "success" : "error",
            confirmButtonText: "Ok",
          }).then(() => {
            history.goBack();
          });
        }
        setNewContext(contextResponse.context);
        setModelName({ [modelResponse.provider]: modelResponse.model });
        setProvider(modelResponse.provider);
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  useEffect(() => {
    if (!("need_consent" in artifactsInput) || artifactsInput.need_consent) {
      checkIfUserIsSignedInConsent();
    } else {
      setCallLoading(false);
    }
  }, [signInConsent]);

  useEffect(() => {
    checkIfUserReachedNecessaryExamples();
    bringDistinctContextAndModelInfo();
  }, []);

  return (
    <>
      {callLoading || loading ? (
        <>Loading...</>
      ) : (
        <>
          {signInConsent ? (
            <>
              <div className="flex items-end justify-between align-end">
                <button
                  type="button"
                  className="my-2 btn btn-outline-primary btn-sm btn-help-info"
                  onClick={() => {
                    setShowInstructions(!showInstructions);
                  }}
                >
                  <span className="text-base font-normal text-letter-color">
                    Instructions
                  </span>
                </button>
                {showInstructions && (
                  <Modal
                    show={showInstructions}
                    onHide={() => {
                      setShowInstructions(false);
                    }}
                    size="lg"
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>Instructions</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <MDEditor.Markdown source={context.instructions} />
                    </Modal.Body>
                  </Modal>
                )}
                <button
                  type="button"
                  className="my-2 btn btn-outline-primary btn-sm btn-help-info"
                  onClick={() => {
                    setShowExample(!showExample);
                  }}
                >
                  <span className="text-base font-normal text-letter-color">
                    Example
                  </span>
                </button>
                {showExample && (
                  <>
                    <Modal
                      show={showExample}
                      onHide={() => {
                        setShowExample(false);
                      }}
                      size="lg"
                    >
                      <Modal.Header closeButton>
                        <Modal.Title>Example</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <MDEditor.Markdown source={example} />
                      </Modal.Body>
                    </Modal>
                  </>
                )}
              </div>
              {
                //if jump_instructions is true and exist in
                //generative context under artifacts, then
                //the instructions will be skipped
              }
              {!readInstructions && (
                <div className="flex flex-col justify-center gap-8">
                  <div
                    id="general-instructions"
                    className="p-4 bg-white border border-gray-200"
                  >
                    <div className="">
                      <h3 className="text-2xl font-bold">
                        {artifactsInput?.first_explainatory_title ||
                          "What do I need to do?"}
                      </h3>
                      <br />
                      {parse(
                        generative_context.artifacts.first_explainatory_block
                      )}
                    </div>
                  </div>
                  {
                    //If example_task is true, then the user will be
                    // display with an example of what the task will look like
                  }
                  {artifactsInput?.example_task && (
                    <div className="px-4 py-2 border border-gray-200 ">
                      <h3 className="text-2xl font-bold">
                        <u>Scenario</u>
                      </h3>
                      <BasicInstructions instructions={context} />
                    </div>
                  )}
                  <div className="flex items-end justify-end gap-4">
                    <GeneralButton
                      text="I understand"
                      onClick={() => setReadInstructions(true)}
                      className="border-0 font-weight-bold light-gray-bg task-action-btn"
                    />
                  </div>
                </div>
              )}
              {readInstructions && provider && modelName && (
                <div className="grid grid-cols-3 gap-3 divide-x-2">
                  <div className="col-span-2">
                    <Chatbot
                      instructions={artifactsInput.general_instruction_chatbot}
                      chatHistory={chatHistory}
                      username={user.username}
                      modelName={modelName}
                      provider={provider}
                      numOfSamplesChatbot={
                        artifactsInput.num_of_samples_chatbot
                      }
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
                  </div>
                  <div className="col-span-1">
                    <div className="px-4 overflow-y-auto max-h-96">
                      <BasicInstructions
                        instructions={newContext?.context_json}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {consentTerms && agreeText && (
                <Modal show={true} onHide={() => setSignInConsent} size="lg">
                  <SignConsent
                    handleClose={handleSignInConsent}
                    consentTerms={consentTerms}
                    agreeText={agreeText}
                  />
                </Modal>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default ChatWithInstructions;
