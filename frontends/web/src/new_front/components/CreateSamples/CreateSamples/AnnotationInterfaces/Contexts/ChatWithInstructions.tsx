import React, { FC, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import Modal from "react-bootstrap/Modal";
import queryString from "query-string";
import useFetch from "use-http";
import Swal from "sweetalert2";

import UserContext from "containers/UserContext";

import SignContractHelpMe from "new_front/components/Modals/SignContractHelpMe";
import Chatbot from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/Contexts/Chatbot";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ChatHistoryType } from "new_front/types/createSamples/createSamples/utils";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import BasicInstructions from "new_front/components/Inputs/BasicInstructions";
import GeneralButton from "new_front/components/Buttons/GeneralButton";

enum TreatmentId {
  Llama = "1",
  GPT = "2",
  Control = "3",
  Cohere = "4",
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
  const [artifactsInput, setArtifactsInput] = useState<any>(
    generative_context.artifacts
  );
  const [controlText, setControlText] = useState("");
  const [finishConversation, setFinishConversation] = useState(false);
  const [readInstructions, setReadInstructions] = useState(false);
  const { updateModelInputs } = useContext(CreateInterfaceContext);
  const [treatmentValue, setTreatmentValue] = useState("");
  const [example, setExample] = useState("");
  const { post, response } = useFetch();
  const { user } = useContext(UserContext);
  const location = useLocation();
  const queryParams = queryString.parse(location.search);
  let treatmentId = queryParams.treatmentId ? queryParams.treatmentId : "2";
  let prolificId = queryParams.assignmentId
    ? queryParams.assignmentId
    : Math.floor(100000 + Math.random() * 900000).toString();

  function getTreatmentValue(treatmentId: TreatmentId): string {
    switch (treatmentId) {
      case TreatmentId.Llama:
        setProvider("huggingface_api");
        return "huggingface_api";
      case TreatmentId.GPT:
        setProvider("openaihm");
        return "openaihm";
      case TreatmentId.Cohere:
        setProvider("coherehm");
        return "coherehm";
      case TreatmentId.Control:
        return "control";
      default:
        setProvider("openaihm");
        return "openaihm";
    }
  }

  const checkIfUserIsSignedInConsent = async () => {
    const signConsent = await post("/task/check_signed_consent", {
      user_id: user.id,
      task_id: taskId,
    });
    if (response.ok) {
      setCallLoading(false);
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

  useEffect(() => {
    if (treatmentId) {
      updateModelInputs({ treatment_id: treatmentId });
      setTreatmentValue(getTreatmentValue(treatmentId as TreatmentId));
      if (getTreatmentValue(treatmentId as TreatmentId) !== "control") {
        const modelConfig =
          // @ts-ignore
          generative_context.artifacts.providers[
            getTreatmentValue(treatmentId as TreatmentId)
          ][0];
        setModelName({
          [getTreatmentValue(treatmentId as TreatmentId)]: modelConfig,
        });
        // @ts-ignore
        setExample(generative_context.artifacts.examples.model);
      } else {
        // @ts-ignore
        setExample(generative_context.artifacts.examples.control);
      }
    } else {
      setTreatmentValue("openaihm");
      setModelName({ openaihm: "gpt-3.5-turbo" });
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
      {callLoading ? (
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
              {!readInstructions ? (
                <div className="flex flex-col justify-center gap-8">
                  <div
                    id="general-instructions"
                    className="p-4 bg-white border border-gray-200"
                  >
                    <div className="">
                      <h3 className="text-2xl font-bold">
                        What do I need to do?
                      </h3>
                      <p className="mb-3">
                        In this study, you will be asked to complete{" "}
                        <strong>two scenarios</strong> which simulate healthcare
                        decisions that a person might encounter in everyday
                        life.{" "}
                        <strong>
                          In each scenario, you will be asked two questions
                        </strong>{" "}
                        about how best to respond:
                        <br />
                        <br />
                        1) What healthcare service do you need? (e.g. A&E or routine GP follow-up)
                        <br />
                        <br />
                        2) Why did you make the choice you did? Please name any
                        specific medical conditions relevant to your decision.
                        <br />
                        <br />
                        The scenario (available below and on the next page)
                        describes the specific details of the case, followed by
                        general life details and an abbreviated medical history.
                        The information provided gives a complete picture of the
                        relevant health details, but also includes additional
                        information which may not be relevant. As with a real
                        health decision, you will need to decide what
                        information is most important.
                        <br />
                      </p>
                      {treatmentValue !== "control" ? (
                        <>
                          <p className="mb-2">
                            To assist in completing the scenarios, please use the 
                            language model provided. We are interested in 
                            understanding how you use the language model provided 
                            and how well it works for you. Therefore, it is 
                            essential that you{" "}<strong>only use your own  
                            words,</strong> and do not copy and paste from the 
                            scenario text, or from any other source.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="">
                            To assist in completing the scenarios, please use a
                            search engine or any other methods you might
                            ordinarily use at home. We are interested in
                            understanding what tools you use and how well they
                            work for you. This may be an online resource, a
                            book, or anything else. It is essential that you{" "}
                            <strong>only use your own words,</strong> and do not
                            copy and paste from the scenario text, or from any
                            other source.
                          </p>
                        </>
                      )}
                      <p className="mb-3">
                        <br />
                        After completing the first scenario, you will return to
                        this page for a different second scenario.
                        <br />
                        <br />
                        Once you have finished reading the instructions, click
                        “I understand” to begin the experiment.
                      </p>
                    </div>
                  </div>
                  {treatmentValue !== "control" && (
                    <div
                      id="brief-instructions"
                      className="p-4 bg-white border border-gray-200"
                    >
                      <h1 className="mb-4 text-2xl font-bold">
                        How does the interface work?
                      </h1>
                      <p className="mb-4">
                        On the next page, we want you to interact with a large
                        language model to help you make a medical decision. The
                        LLM used in this experiment uses a chat interface. You
                        can type in sentences, such as questions about the
                        scenario, and the LLM will generate new text in
                        response. After you have read the response, click “Save”
                        and then you will be able to ask another question. You
                        may interact with the model up to 10 times, and must
                        interact at least once. When you are finished using the
                        language model, press the “Finish” button to save the
                        whole conversation and move on to the scenario
                        questions.
                      </p>
                    </div>
                  )}
                  <div className="px-4 py-2 border border-gray-200 ">
                    <h3 className="text-2xl font-bold"><u>Scenario</u></h3>
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
                        instructions={
                          artifactsInput.general_instruction_chatbot
                        }
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
                    ) : (
                      <>
                        <div>
                          <p className="text-lg font-bold">
                            The scenario details are available on the right. You
                            will need to answer two questions:
                          </p>
                          <ol>
                            <li> 1) What healthcare service do you need?</li>
                            <li> 2) Why did you make the choice you did? </li>
                          </ol>
                          Use the any methods you ordinarily use at home (e.g.
                          online search, reference book) to determine the best
                          response to the scenario.
                          <br />
                          <p style={{ color: "MediumSeaGreen" }}>
                            Keep track of the methods you are using in the
                            textbox below. Once you click “Submit” the scenario
                            questions will appear.
                          </p>
                        </div>
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
      )}
    </>
  );
};

export default ChatWithInstructions;
