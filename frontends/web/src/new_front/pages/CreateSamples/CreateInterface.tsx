import AnnotationTitle from "../../components/CreateSamples/CreateSamples/AnnotationTitle";
import CreateInterfaceHelpersButton from "new_front/components/Buttons/CreateInterfaceHelpersButton";
import AnnotationContextStrategy from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/Contexts/AnnotationContextStrategy";
import AnnotationGoalStrategy from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/Goals/AnnotationGoalStrategy";
import AnnotationUserInputStrategy from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/UserInput/AnnotationUserInputStrategy";
import AnnotationButtonActions from "../../components/CreateSamples/CreateSamples/AnnotationButtonActions";
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
import UserContext from "containers/UserContext";
import { PacmanLoader } from "react-spinners";
import useFetch from "use-http";
import {
  CreateInterfaceContext,
  CreateInterfaceProvider,
} from "new_front/context/CreateInterface/Context";
import Swal from "sweetalert2";
import { useLocation } from "react-router-dom";
import { translateYamlConfig } from "utils/yamlTranslation";
import { useTranslation } from "react-i18next";

const CreateInterface = () => {
  const [modelOutput, setModelOutput] = useState<ModelOutputType>();
  const [modelInTheLoop, setModelInTheLoop] = useState<string>("");
  const [partialSampleId, setPartialSampleId] = useState(0);
  const [taskConfiguration, setTaskConfiguration] =
    useState<ConfigurationTask>();
  const [originalTaskConfiguration, setOriginalTaskConfiguration] =
    useState<ConfigurationTask>();
  const [taskContextInfo, setTaskContextInfo] = useState<InfoContextTask>();
  const [taskInfo, setTaskInfo] = useState<TaskInfoType>();
  const [taskId, setTaskId] = useState(0);
  const [amountExamples, setAmountExamples] = useState(0);
  const [isGenerativeContext, setIsGenerativeContext] =
    useState<boolean>(false);
  const { hidden, setHidden } = useContext(OverlayContext);
  const { get, post, response, loading } = useFetch();
  let { taskCode } = useParams<{ taskCode: string }>();
  const { user } = useContext(UserContext);
  const { updateAmountExamplesCreatedToday } = useContext(
    CreateInterfaceContext
  );
  const history = useHistory();
  const location = useLocation();
  const { i18n } = useTranslation();

  // Parse the query parameters
  const queryParams = new URLSearchParams(location.search);
  const assignmentId = queryParams.get("assignmentId");
  const treatmentId = queryParams.get("treatmentId");

  const checkIfUserCanCreateSample = async () => {
    if (response.ok) {
      const stillAllowedToSubmit = await post(
        `/rounduserexample/still_allowed_to_submit`,
        {
          round_id: taskContextInfo?.real_round_id,
          user_id: user.id!,
        }
      );
      if (!stillAllowedToSubmit) {
        Swal.fire({
          icon: "warning",
          title: "Oops...",
          text: "You have reached the maximum amount of examples you can submit today. Please try again tomorrow.",
          confirmButtonColor: "#2088ef",
          timer: 5000,
        });
        history.push(`/`);
      }
    }
  };

  const loadTaskContextData = async () => {
    const taskId = await get(`/task/get_task_id_by_task_code/${taskCode}`);
    const [taskConfiguration, modelInTheLoop, taskInfo] = await Promise.all([
      get(`/context/get_context_configuration?task_id=${taskId}`),
      post(`/model/get_model_in_the_loop`, {
        task_id: taskId,
      }),
      get(`/task/get_task_with_round_info_by_task_id/${taskId}`),
    ]);
    if (response.ok) {
      // Store the original untranslated configuration
      setOriginalTaskConfiguration(taskConfiguration as ConfigurationTask);
      // Apply translations and store the translated configuration
      const translatedTaskConfiguration = translateYamlConfig(
        taskConfiguration
      ) as ConfigurationTask;
      setTaskConfiguration(translatedTaskConfiguration);
      setModelInTheLoop(modelInTheLoop);
      setTaskInfo(taskInfo);
      setTaskId(taskId);
      setIsGenerativeContext(
        (translatedTaskConfiguration.context as any)?.generative_context
          ?.is_generative || false
      );
    }
  };

  const loadTaskContext = async () => {
    const configContext = taskConfiguration?.context as any;
    let needContext;
    if ("context_for_start" in configContext) {
      needContext = configContext.context_for_start ? true : false;
    } else {
      needContext = true;
    }
    await post(`/context/get_context`, {
      task_id: taskId,
      need_context: needContext,
    }).then((response) => {
      setTaskContextInfo(response);
    });
  };

  const isLogin = async (
    assignmentId: string | null,
    taskCode: string,
    treatmentId: string | null
  ) => {
    if (!user.id) {
      await checkUserIsLoggedIn(
        history,
        `/`,
        assignmentId,
        taskCode,
        treatmentId
      );
    }
  };

  useEffect(() => {
    isLogin(assignmentId, taskCode, treatmentId);
  }, [user]);

  useEffect(() => {
    taskConfiguration && taskId && loadTaskContext();
  }, [taskConfiguration, taskId]);

  useEffect(() => {
    if (user.id) {
      loadTaskContextData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  useEffect(() => {
    if (taskContextInfo?.real_round_id) {
      updateAmountExamplesCreatedToday(
        taskContextInfo?.real_round_id,
        user.id!
      );
    }
  }, [taskContextInfo, user]);

  useEffect(() => {
    if (taskContextInfo?.real_round_id) {
      checkIfUserCanCreateSample();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskContextInfo?.real_round_id]);

  // Handle language changes - re-translate the configuration when language changes
  useEffect(() => {
    if (originalTaskConfiguration) {
      const translatedTaskConfiguration = translateYamlConfig(
        originalTaskConfiguration
      ) as ConfigurationTask;
      setTaskConfiguration(translatedTaskConfiguration);
    }
  }, [i18n.language, originalTaskConfiguration]);

  return (
    <>
      {loading || !taskContextInfo || !taskConfiguration || !taskInfo ? (
        <div className="flex items-center justify-center h-screen">
          <PacmanLoader color="#ccebd4" loading={loading} size={50} />
        </div>
      ) : (
        <CreateInterfaceProvider>
          <div className="container mb-5">
            <div id="title">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <AnnotationTitle
                    taskName={taskInfo?.name!}
                    subtitle={`${
                      taskConfiguration?.creation_samples_title
                        ? taskConfiguration?.creation_samples_title
                        : "Find examples that fool the model"
                    }`}
                  />
                </div>
                <div className="flex items-start justify-end pr-4 pt-14">
                  <CreateInterfaceHelpersButton
                    generalInstructions={taskInfo?.instructions_md!}
                    creationExample={taskInfo?.creation_example_md!}
                    realRoundId={taskContextInfo?.real_round_id!}
                    userId={user.id!}
                  />
                </div>
              </div>
            </div>
            <div className="p-2 border">
              <div id="goal">
                {taskConfiguration?.goal && (
                  <AnnotationGoalStrategy
                    config={taskConfiguration?.goal as any}
                    hidden={hidden}
                  />
                )}
              </div>
              <div id="context" className="p-3 mb-1 rounded">
                {taskInfo.challenge_type === 1 && (
                  <h6 className="text-[15px] text-[#005798] font-bold pl-2">
                    CONTEXT:
                  </h6>
                )}
                {taskConfiguration?.context && taskContextInfo && (
                  <AnnotationContextStrategy
                    config={taskConfiguration?.context as any}
                    context={taskContextInfo?.current_context}
                    contextId={taskContextInfo?.context_id}
                    taskId={taskInfo?.id}
                    realRoundId={taskContextInfo?.real_round_id}
                    hidden={hidden}
                    setPartialSampleId={setPartialSampleId}
                    setIsGenerativeContext={setIsGenerativeContext}
                    userId={user.id!}
                    setContextInfo={
                      (taskConfiguration?.context as any)?.context_for_start
                        ? undefined
                        : setTaskContextInfo
                    }
                  />
                )}
              </div>
              <div id="inputUser" className="flex flex-col gap-12 md:gap-4">
                {taskConfiguration?.user_input && (
                  <AnnotationUserInputStrategy
                    config={taskConfiguration?.user_input as any}
                    isGenerativeContext={isGenerativeContext}
                    hidden={hidden}
                    groupby={
                      (taskConfiguration as any)?.context?.metadata
                        ?.user_input_group_by || 0
                    }
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
                    neccessaryFields={taskConfiguration.required_fields}
                    isGenerativeContext={isGenerativeContext}
                    userId={user.id!}
                    accept_sandbox_creation={Boolean(
                      taskInfo.accept_sandbox_creation
                    )}
                    setModelOutput={setModelOutput}
                    setIsGenerativeContext={setIsGenerativeContext}
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
                    sandBox={modelOutput.sandBox}
                    isGenerativeContext={isGenerativeContext}
                  />
                )}
              </div>
            </div>
          </div>
        </CreateInterfaceProvider>
      )}
    </>
  );
};

export default CreateInterface;
