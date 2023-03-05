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
import { InfoContextTask } from "new_front/types/createSamples/configurationTask";
import SelectBetweenImages from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/Contexts/SelectBetweenImages";

const CreateInterface = (taskId: number) => {
  taskId = 1;
  const [modelInputs, setModelInputs] = useState<object>({});
  const [modelOutput, setModelOutput] = useState<ModelOutputType>();
  const [modelInTheLoop, setModelInTheLoop] = useState<string>("");
  const [taskContextInfo, setTaskContextInfo] = useState<InfoContextTask>();
  const [taskInfoName, setTaskInfoName] = useState<string>("");
  const { get, post, response, loading } = useFetch();

  // const taskDefinitionDummy = {
  //   context_id: 0,
  //   context_info: {
  //     goal: {
  //       type: 'plain-text',
  //       text: 'lorem',
  //     },
  //     context: {
  //       type: 'select-images',
  //       field_names_for_the_model: {
  //         context: 'image',
  //       },
  //     },
  //     user_input: [
  //       {
  //         type: 'text',
  //         placeholder: 'type...',
  //         field_name_for_the_model: 'input',
  //       },
  //     ],
  //     model_input: {},
  //     response_fields: {
  //       input_by_user: '',
  //     },
  //   },
  //   current_context: {
  //     context: '',
  //   },
  //   real_round_id: 0,
  //   tags: '',
  // }

  const updateModelInputs = (input: object) => {
    setModelInputs((prevModelInputs) => {
      return { ...prevModelInputs, ...input };
    });
  };

  const loadTaskContextData = async () => {
    const [taskContextInfo, modelInTheLoop, taskInfo] = await Promise.all([
      post(`/context/get_context`, {
        task_id: taskId,
      }),
      post(`/model/get_model_in_the_loop`, {
        task_id: taskId,
      }),
      get(`/task/get_task_with_round_info_by_task_id/${taskId}`),
    ]).then();
    if (response.ok) {
      setTaskContextInfo(taskContextInfo);
      setModelInTheLoop(modelInTheLoop.light_model);
      setTaskInfoName(taskInfo.name);
    }
  };

  useEffect(() => {
    loadTaskContextData();
  }, []);

  return (
    <>
      {loading || !taskContextInfo ? (
        <div>Loading...</div>
      ) : (
        <div className="container">
          <div id="title">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <AnnotationTitle taskName="CAT" />
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
              config={taskContextInfo?.context_info.goal as any}
              task={{}}
              onInputChange={updateModelInputs}
            />
          </div>
          <div className="border-2 ">
            <div id="context" className="p-3 mb-1 rounded light-gray-bg">
              <h6 className="text-xs text-[#005798] font-bold pl-2">
                CONTEXT:
              </h6>
              <SelectBetweenImages />

              {/* <AnnotationContextStrategy
                config={taskContextInfo.context_info.context as any}
                task={{}}
                context={taskContextInfo?.current_context}
                onInputChange={updateModelInputs}
              /> */}
            </div>
            <div id="inputUser" className="p-3">
              <AnnotationUserInputStrategy
                config={taskContextInfo?.context_info.user_input as any}
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
              {taskContextInfo && (
                <AnnotationButtonActions
                  modelInTheLoop={modelInTheLoop}
                  context_id={taskContextInfo?.context_id}
                  tags={taskContextInfo?.tags}
                  real_round_id={taskContextInfo?.real_round_id}
                  current_context={taskContextInfo?.current_context}
                  modelInputs={modelInputs}
                  taskID={3}
                  inputByUser={
                    taskContextInfo?.context_info?.response_fields
                      ?.input_by_user
                  }
                  setModelOutput={setModelOutput}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateInterface;
