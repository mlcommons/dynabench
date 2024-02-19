import React, { FC, useContext, useEffect, useState } from "react";
import SignContract from "new_front/components/Modals/SignContract";
import SimpleChatbot from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/Contexts/SimpleChatbot";
import useFetch from "use-http";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import UserContext from "containers/UserContext";
import Modal from "react-bootstrap/Modal";
import { ChatHistoryType } from "new_front/types/createSamples/createSamples/utils";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";

const ChatWithInstructions: FC<
  ContextAnnotationFactoryType & ContextConfigType
> = ({ taskId, generative_context, setIsGenerativeContext, contextId }) => {
  const [signInConsent, setSignInConsent] = useState(false);
  const { post, response } = useFetch();
  const [chatHistory, setChatHistory] = useState<ChatHistoryType>({
    user: [],
    bot: [],
  });
  const [modelName, setModelName] = useState("");
  const [provider, setProvider] = useState("");
  const [artifactsInput, setArtifactsInput] = useState<any>(
    generative_context.artifacts,
  );
  const [finishConversation, setFinishConversation] = useState(false);
  const { updateModelInputs } = useContext(CreateInterfaceContext);
  const { user } = useContext(UserContext);

  const checkIfUserIsSignedInConsent = async () => {
    const signConsent = await post("/task/check_sign_consent", {
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
      {signInConsent ? (
        <div className="grid grid-cols-3 gap-3 divide-x-2">
          <div className="col-span-2">
            <SimpleChatbot
              instructions={"<p>Instructions</p>"}
              chatHistory={chatHistory}
              username={user.username}
              modelName={modelName}
              provider={provider}
              setChatHistory={setChatHistory}
              updateModelInputs={updateModelInputs}
              setIsGenerativeContext={setIsGenerativeContext}
            />
          </div>
          <div className="col-span-1">
            <div className="p-4 bg-white">
              <h2 className="mb-4 text-2xl font-bold">Instructions</h2>
              <p className="text-gray-600">
                You are playing the part of a 47-year-old female patient who is
                concerned about having problems with her memory. She keeps
                forgetting basic things around the house, like where she put her
                keys or why she walked into a room. She has sticky notes all
                over the house to help her remember everything. She first
                started noticing about six months ago, but it has gotten worse,
                to the point that some of her colleagues at work have also asked
                about it. She is worried that it could be something to do with
                dementia.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <Modal show={true} onHide={() => setSignInConsent} size="lg">
          <SignContract handleClose={handleSignInConsent} />
        </Modal>
      )}
    </>
  );
};

export default ChatWithInstructions;
