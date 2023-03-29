import BootstrapSwitchButton from "bootstrap-switch-button-react";
import UserContext from "containers/UserContext";
import GeneralButton from "new_front/components/Buttons/GeneralButton";
import { ModelEvaluationMetric } from "new_front/types/createSamples/createSamples/configurationTask";
import { ModelOutputType } from "new_front/types/createSamples/createSamples/modelOutput";
import React, { FC, useState } from "react";
import { Button } from "react-bootstrap";
import { PacmanLoader } from "react-spinners";
import useFetch from "use-http";

type Props = {
  modelInTheLoop: string;
  contextId: number;
  tags: string | undefined;
  realRoundId: number;
  currentContext: any;
  modelInputs: any;
  taskID: number;
  inputByUser: string;
  modelPredictionLabel: string;
  modelEvaluationMetricInfo: ModelEvaluationMetric;
  isGenerativeContext: boolean;
  userId: number;
  setModelOutput: (modelOutput: ModelOutputType) => void;
};

const AnnotationButtonActions: FC<Props> = ({
  modelInTheLoop,
  contextId,
  tags,
  realRoundId,
  currentContext,
  modelInputs,
  taskID,
  inputByUser,
  modelPredictionLabel,
  modelEvaluationMetricInfo,
  isGenerativeContext,
  userId,
  setModelOutput,
}) => {
  const [sandboxMode, setSandboxMode] = useState<boolean>(false);

  const { post, loading } = useFetch();

  const onSubmission = async () => {
    modelInputs = {
      ...modelInputs,
      input_by_user: inputByUser,
    };

    const finaModelInputs = {
      model_input: modelInputs,
      sandbox_mode: sandboxMode,
      user_id: userId,
      context_id: contextId,
      tag: tags,
      round_id: realRoundId,
      task_id: taskID,
      model_url: modelInTheLoop,
      model_prediction_label: modelPredictionLabel,
      model_evaluation_metric_info: modelEvaluationMetricInfo,
    };

    const modelOutput = await post(
      `/model/single_model_prediction_submit`,
      finaModelInputs
    );
    setModelOutput(modelOutput);
  };

  return (
    <>
      {!loading ? (
        <>
          {!isGenerativeContext ? (
            <>
              <div className="col-span-1 py-4">
                <div className="grid grid-cols-6">
                  <div className="col-span-3 px-3 text-white">
                    <BootstrapSwitchButton
                      checked={!sandboxMode}
                      onlabel="Live Mode"
                      onstyle="dark"
                      offstyle="warning"
                      offlabel="Sandbox"
                      width={120}
                      onChange={(checked: boolean) => {
                        setSandboxMode(!checked);
                      }}
                    />
                  </div>
                  <div className="flex justify-end col-span-3 ">
                    <div className="col-span-1 pl-2" id="switchContext">
                      {currentContext && (
                        <Button
                          className="border-0 font-weight-bold light-gray-bg task-action-btn"
                          onClick={() => {
                            window.location.reload();
                          }}
                        >
                          New context
                        </Button>
                      )}
                    </div>
                    <div className="col-span-1 pl-2 pr-3" id="submit">
                      <Button
                        className="border-0 font-weight-bold light-gray-bg task-action-btn"
                        onClick={onSubmission}
                      >
                        Submit
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <GeneralButton
                onClick={() => {}}
                text="Generate Images"
                className="border-0 font-weight-bold light-gray-bg task-action-btn mt-4"
              />
            </>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-32">
          <PacmanLoader color="#ccebd4" loading={loading} size={50} />
        </div>
      )}
    </>
  );
};

export default AnnotationButtonActions;
