import React, { useEffect, useState } from "react";
import AnnotationTitle from "../../components/CreateSamples/CreateSamples/AnnotationTitle";
import AnnotationHelperButtons from "../../components/CreateSamples/CreateSamples/AnnotationHelperButtons";
import AnnotationGoalStrategy from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/Goals/AnnotationGoalStrategy";
import AnnotationContextStrategy from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/Contexts/AnnotationContextStrategy";
import AnnotationUserInputStrategy from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/UserInput/AnnotationUserInputStrategy";
import AnnotationButtonActions from "../../components/CreateSamples/CreateSamples/AnnotationButtonActions";
import useFetch from "use-http";
import ResponseInfo from "new_front/components/CreateSamples/CreateSamples/ResponseInfo";
import { ModelOutputType } from "new_front/types/createSamples/modelOutput";
import { ConfigurationTask } from "new_front/types/createSamples/configurationTask";

const CreateInterface = (taskId: number) => {
  taskId = 2;
  const [modelInputs, setModelInputs] = useState<object>({});
  const [modelOutput, setModelOutput] = useState<ModelOutputType>();
  const [modelInTheLoop, setModelInTheLoop] = useState<string>("");
  const [taskInfo, setTaskInfo] = useState<any>({});

  const { post, response, loading } = useFetch();

  const updateModelInputs = (input: object) => {
    setModelInputs((prevModelInputs) => {
      return { ...prevModelInputs, ...input };
    });
  };

  const loadTaskContextData = async () => {
    const [taskContextInfo, modelInTheLoop] = await Promise.all([
      post(`/context/get_context`, {
        task_id: taskId,
      }),
      post(`/model/get_model_in_the_loop`, {
        task_id: taskId,
      }),
    ]);
    if (response.ok) {
      setTaskInfo(taskContextInfo.context_info);
      setModelInTheLoop(modelInTheLoop.light_model);
      console.log(taskInfo);
    }
  };

  useEffect(() => {
    loadTaskContextData();
  }, []);

  const context = {
    context: {
      question: "I am a question",
      answer: "I am an answer",
      context:
        "Captain Nasim Salem Al Mashawi, Director of Innovation and Future Prospects said that, since its establishment three years ago, Leadership Innovation Section has completed 25 workshops and training courses on innovation, prospecting and project management, with the participation of police and various government departments and agencies in Sharjah. The Innovation and Future Prospects Department is keen to participate actively in the UAE Innovation Month, with the aim of spreading the culture of innovation among government employees and visitors to innovation platforms.",
    },
    id: 1,
    tag: "",
    real_round_id: 1,
  };

  return (
    <>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="container">
          <div id="title">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <AnnotationTitle taskName="Hate speech" />
              </div>
              <div>
                <div className="grid grid-cols-3 gap-2">
                  {/* <AnnotationHelperButtons /> */}
                </div>
              </div>
            </div>
          </div>
          <div id="goal" className="mb-3 ">
            <AnnotationGoalStrategy
              config={taskInfo.goal as any}
              task={{}}
              onInputChange={updateModelInputs}
            />
          </div>
          <div className="border-2 ">
            <div id="context" className="p-3 mb-1 rounded light-gray-bg">
              <h6 className="text-xs text-[#005798] font-bold pl-2">
                CONTEXT:
              </h6>
              <AnnotationContextStrategy
                config={taskInfo.context as any}
                task={{}}
                context={context.context}
                onInputChange={updateModelInputs}
              />
            </div>
            <div id="inputUser" className="p-3">
              <AnnotationUserInputStrategy
                config={taskInfo.user_input as any}
                task={{}}
                onInputChange={updateModelInputs}
              />
            </div>
            <div id="responseInfo" className="max-h-96">
              {modelOutput && (
                <ResponseInfo
                  label={modelOutput.label}
                  input={modelOutput.input}
                  prediction={modelOutput.prediction}
                  probabilities={modelOutput.probabilities}
                  fooled={modelOutput.fooled}
                />
              )}
            </div>
            <div id="buttons">
              {/* <AnnotationButtonActions
              modelInTheLoop={modelInTheLoop}
              context={context}
              modelInputs={modelInputs}
              taskID={3}
              inputByUser={taskInfo.response_fields.input_by_user}
              setModelOutput={setModelOutput}
            /> */}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateInterface;
