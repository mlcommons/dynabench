import React, { FC, useContext, useEffect, useState } from "react";
import SignContract from "new_front/components/Modals/SignContract";
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

const ChatWithInstructions: FC<
  ContextAnnotationFactoryType & ContextConfigType
> = ({ taskId, generative_context, setIsGenerativeContext, context }) => {
  const [signInConsent, setSignInConsent] = useState(false);
  const { post, response } = useFetch();
  const [chatHistory, setChatHistory] = useState<ChatHistoryType>({
    user: [],
    bot: [],
  });
  const [modelName, setModelName] = useState({
    openai: {
      model_name: "gpt-3.5-turbo",
      frequency_penalty: 0,
      presence_penalty: 0,
      temperature: 1,
      top_p: 1,
      max_tokens: 256,
      templates: {
        header:
          "You are a conversational assistant. Limit your answers to around 50 words. Do not refer to your word limit.",
        footer: "",
      },
    },
  });
  const [provider, setProvider] = useState("openai");
  const [artifactsInput, setArtifactsInput] = useState<any>(
    generative_context.artifacts,
  );
  const [finishConversation, setFinishConversation] = useState(false);
  const [readInstructions, setReadInstructions] = useState(false);
  const { updateModelInputs } = useContext(CreateInterfaceContext);
  const { user } = useContext(UserContext);

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

  useEffect(() => {
    checkIfUserIsSignedInConsent();
  }, [signInConsent]);

  return (
    <>
      {!signInConsent ? (
        <>
          {!readInstructions ? (
            <div className="flex flex-col justify-center gap-8">
              <BasicInstructions instructions={context} />
              <div className="flex items-end justify-end gap-4">
                <GeneralButton
                  text="I agree"
                  onClick={() => setReadInstructions(true)}
                  className="border-0 font-weight-bold light-gray-bg task-action-btn"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 divide-x-2">
              <div className="col-span-2">
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
              </div>
              <div className="col-span-1">
                <div className="p-4 bg-white">
                  <h2 className="mb-4 text-2xl font-bold">Instructions</h2>
                  <p className="text-gray-600">
                    You are playing the part of a 47-year-old female patient who
                    is concerned about having problems with her memory. She
                    keeps forgetting basic things around the house, like where
                    she put her keys or why she walked into a room. She has
                    sticky notes all over the house to help her remember
                    everything. She first started noticing about six months ago,
                    but it has gotten worse, to the point that some of her
                    colleagues at work have also asked about it. She is worried
                    that it could be something to do with dementia.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <Modal show={true} onHide={() => setSignInConsent} size="lg">
          <SignContract handleClose={handleSignInConsent} />
        </Modal>
      )}
    </>
  );
};

export default ChatWithInstructions;
