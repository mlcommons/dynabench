import UserContext from "containers/UserContext";
import CreateInterfaceHelpersButton from "new_front/components/Buttons/CreateInterfaceHelpersButton";
import AnnotationContextStrategy from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/Contexts/AnnotationContextStrategy";
import AnnotationGoalStrategy from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/Goals/AnnotationGoalStrategy";
import AnnotationUserInputStrategy from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/UserInput/AnnotationUserInputStrategy";
import ResponseInfo from "new_front/components/CreateSamples/CreateSamples/ResponseInfo";
import { OverlayContext } from "new_front/components/OverlayInstructions/Provider";
import {
  ConfigurationTask,
  InfoContextTask,
} from "new_front/types/createSamples/createSamples/configurationTask";
import { ModelOutputType } from "new_front/types/createSamples/createSamples/modelOutput";
import { TaskInfoType } from "new_front/types/task/taskInfo";
import { checkUserIsLoggedIn } from "new_front/utils/helpers/functions/LoginFunctions";
import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { PacmanLoader } from "react-spinners";
import useFetch from "use-http";
import AnnotationButtonActions from "../../components/CreateSamples/CreateSamples/AnnotationButtonActions";
import AnnotationTitle from "../../components/CreateSamples/CreateSamples/AnnotationTitle";

const CreateInterface = () => {
  const [modelInputs, setModelInputs] = useState<object>({});
  const [metadataExample, setMetadataExample] = useState<object>({});
  const [modelOutput, setModelOutput] = useState<ModelOutputType>();
  const [modelInTheLoop, setModelInTheLoop] = useState<string>("");
  const [partialSampleId, setPartialSampleId] = useState<number>();
  const [taskConfiguration, setTaskConfiguration] =
    useState<ConfigurationTask>();
  const [taskContextInfo, setTaskContextInfo] = useState<InfoContextTask>();
  const [taskInfo, setTaskInfo] = useState<TaskInfoType>();
  const [taskId, setTaskId] = useState<number>(0);
  const [isGenerativeContext, setIsGenerativeContext] =
    useState<boolean>(false);
  const { hidden, setHidden } = useContext(OverlayContext);
  const { get, post, response, loading } = useFetch();
  let { taskCode } = useParams<{ taskCode: string }>();
  const userContext = useContext(UserContext);
  const { user } = userContext;
  const history = useHistory();

  const updateModelInputs = (input: object, metadata?: boolean) => {
    if (!metadata) {
      setModelInputs((prevModelInputs) => {
        return { ...prevModelInputs, ...input };
      });
    } else {
      setMetadataExample((prevModelInputs) => {
        return { ...prevModelInputs, ...input };
      });
    }
  };

  const loadTaskContextData = async () => {
    const taskId = await get(`/task/get_task_id_by_task_code/${taskCode}`);
    const [taskContextInfo, taskConfiguration, modelInTheLoop, taskInfo] =
      await Promise.all([
        post(`/context/get_context`, {
          task_id: taskId,
        }),
        get(`/context/get_context_configuration?task_id=${taskId}`),
        post(`/model/get_model_in_the_loop`, {
          task_id: taskId,
        }),
        get(`/task/get_task_with_round_info_by_task_id/${taskId}`),
      ]).then();
    if (response.ok) {
      setTaskContextInfo(taskContextInfo);
      setTaskConfiguration(taskConfiguration);
      setModelInTheLoop(modelInTheLoop);
      setTaskInfo(taskInfo);
      setTaskId(taskId);
      setIsGenerativeContext(
        taskConfiguration.context.generative_context?.is_generative
      );
    }
  };

  const createPartialSample = async () => {
    if (isGenerativeContext) {
      const partialSampleId = await post(
        `/example/partially_creation_generative_example`,
        {
          example_info: modelInputs,
          context_id: taskContextInfo?.current_context?.id,
          user_id: user?.id,
          round_id: taskInfo?.round?.id,
          task_id: taskId,
        }
      );
      if (response.ok) {
        setPartialSampleId(partialSampleId);
      }
    }
  };

  const handleData = async () => {
    const isLogin = await checkUserIsLoggedIn(
      history,
      `/tasks/${taskCode}/create`
    );
    if (isLogin) {
      loadTaskContextData();
    }
  };

  useEffect(() => {
    createPartialSample();
  }, [isGenerativeContext]);

  useEffect(() => {
    handleData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {loading || !taskContextInfo || !taskConfiguration ? (
        <div className="flex items-center justify-center h-screen">
          <PacmanLoader color="#ccebd4" loading={loading} size={50} />
        </div>
      ) : (
        <div className="container">
          <div id="title">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <AnnotationTitle
                  taskName={taskInfo?.name!}
                  subtitle="Find examples that fool the model"
                />
              </div>
              <div className="flex items-start justify-end pr-4 pt-14">
                <CreateInterfaceHelpersButton
                  generalInstructions={taskInfo?.instructions_md!}
                />
              </div>
            </div>
          </div>
          <div className="border p-2">
            <div id="goal">
              {taskConfiguration?.goal && (
                <AnnotationGoalStrategy
                  config={taskConfiguration?.goal as any}
                  task={{}}
                  onInputChange={updateModelInputs}
                  hidden={hidden}
                />
              )}
            </div>
            <div id="context" className="p-3 mb-1 rounded">
              <h6 className="text-xs text-[#005798] font-bold pl-2">
                CONTEXT:
              </h6>
              {taskConfiguration?.context && (
                <AnnotationContextStrategy
                  config={taskConfiguration?.context as any}
                  task={{}}
                  context={taskContextInfo?.current_context}
                  createPartialSample={createPartialSample}
                  onInputChange={updateModelInputs}
                  setIsGenerativeContext={setIsGenerativeContext}
                  hidden={hidden}
                />
              )}
            </div>
            <div id="inputUser" className="p-3">
              {taskConfiguration?.user_input && (
                <AnnotationUserInputStrategy
                  config={taskConfiguration?.user_input as any}
                  task={{}}
                  onInputChange={updateModelInputs}
                  isGenerativeContext={isGenerativeContext}
                  hidden={hidden}
                />
              )}
            </div>
            <div id="buttons">
              {taskContextInfo && taskConfiguration && (
                <AnnotationButtonActions
                  modelInTheLoop={modelInTheLoop}
                  contextId={taskContextInfo?.context_id}
                  tags={taskContextInfo?.tags}
                  realRoundId={taskContextInfo?.real_round_id}
                  currentContext={taskContextInfo?.current_context}
                  modelInputs={modelInputs}
                  metadataExample={metadataExample}
                  taskID={taskId}
                  inputByUser={
                    taskConfiguration?.response_fields?.input_by_user
                  }
                  modelPredictionLabel={
                    taskConfiguration?.model_output?.model_prediction_label
                  }
                  modelEvaluationMetricInfo={
                    taskConfiguration?.model_evaluation_metric
                  }
                  partialSampleId={partialSampleId}
                  isGenerativeContext={isGenerativeContext}
                  userId={user.id!}
                  setModelOutput={setModelOutput}
                />
              )}
            </div>
            <div id="responseInfo">
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
          </div>
        </div>
      )}
    </>
  );
};

export default CreateInterface;
