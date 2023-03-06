import BatchCreateSamples from "components/Forms/BatchCreateSamples";
import React, { FC, useState, useContext } from "react";
import { Button, Modal } from "react-bootstrap";
import useFetch from "use-http";
import { ModelOutputType } from "new_front/types/createSamples/modelOutput";
import BootstrapSwitchButton from "bootstrap-switch-button-react";
import UserContext from "containers/UserContext";

type Props = {
  modelInTheLoop: string;
  context_id: number;
  tags: string | undefined;
  real_round_id: number;
  current_context: any;
  modelInputs: any;
  taskID: number;
  inputByUser: string;
  labelForTheModelPrediction: string;
  setModelOutput: (modelOutput: ModelOutputType) => void;
};

const AnnotationButtonActions: FC<Props> = ({
  modelInTheLoop,
  context_id,
  tags,
  real_round_id,
  current_context,
  modelInputs,
  taskID,
  inputByUser,
  labelForTheModelPrediction,
  setModelOutput,
}) => {
  const [showCreateBatchModal, setShowCreateBatchModal] =
    useState<boolean>(false);
  const [sandboxMode, setSandboxMode] = useState<boolean>(true);

  const userContext = useContext(UserContext);
  const { user } = userContext;

  const { post, loading } = useFetch();

  const onSubmission = async () => {
    modelInputs = {
      ...modelInputs,
      input_by_user: inputByUser,
    };
    const finaModelInputs = {
      model_input: modelInputs,
      sandbox_mode: sandboxMode,
      user_id: 1675,
      context_id: context_id,
      tag: tags,
      round_id: real_round_id,
      task_id: taskID,
      model_url: modelInTheLoop,
      label_for_the_model_prediction: labelForTheModelPrediction,
    };
    const modelOutput = await post(
      `/model/single_model_prediction_submit`,
      finaModelInputs
    );
    setModelOutput(modelOutput);
  };

  return (
    <>
      <div className="col-span-1 py-4">
        <div className="grid grid-cols-6">
          <div className="col-span-3 px-3">
            <BootstrapSwitchButton
              checked={!sandboxMode}
              onlabel="Live Mode"
              offstyle="warning"
              offlabel="Sandbox"
              width={120}
              onChange={(checked: boolean) => {
                setSandboxMode(checked);
              }}
            />
          </div>
          <div className="flex justify-end col-span-3 ">
            <div className="col-span-1 pl-2" id="batchSubmission">
              <Button
                className="border-0 font-weight-bold light-gray-bg task-action-btn"
                onClick={() => {
                  setShowCreateBatchModal(true);
                }}
              >
                Batch submissions
              </Button>
              {showCreateBatchModal && (
                <>
                  <Modal
                    show={showCreateBatchModal}
                    onHide={() => {
                      setShowCreateBatchModal(false);
                    }}
                  >
                    <BatchCreateSamples modelInTheLoop={modelInTheLoop} />
                  </Modal>
                </>
              )}
            </div>
            <div className="col-span-1 pl-2" id="switchContext">
              {current_context && (
                <Button
                  className="border-0 font-weight-bold light-gray-bg task-action-btn"
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  Switch to next context
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
  );
};

export default AnnotationButtonActions;
