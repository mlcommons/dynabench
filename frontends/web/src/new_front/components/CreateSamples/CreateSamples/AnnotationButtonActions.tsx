import BootstrapSwitchButton from "bootstrap-switch-button-react";
import { ModelEvaluationMetric } from "new_front/types/createSamples/createSamples/configurationTask";
import { ModelOutputType } from "new_front/types/createSamples/createSamples/modelOutput";
import React, { FC, useContext, useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { PacmanLoader } from "react-spinners";
import useFetch from "use-http";
import Swal from "sweetalert2";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";

type Props = {
  modelInTheLoop: string;
  contextId: number;
  tags: string | undefined;
  realRoundId: number;
  currentContext: any;
  taskID: number;
  inputByUser: string;
  modelPredictionLabel: string;
  modelEvaluationMetricInfo: ModelEvaluationMetric;
  isGenerativeContext: boolean;
  userId: number;
  partialSampleId?: any;
  neccessaryFields: string[];
  accept_sandbox_creation: boolean;
  maxAmountExamplesOnADay: number;
  setModelOutput: (modelOutput: ModelOutputType) => void;
};

const AnnotationButtonActions: FC<Props> = ({
  modelInTheLoop,
  contextId,
  tags,
  realRoundId,
  currentContext,
  taskID,
  inputByUser,
  modelPredictionLabel,
  modelEvaluationMetricInfo,
  isGenerativeContext,
  userId,
  partialSampleId,
  neccessaryFields,
  accept_sandbox_creation,
  maxAmountExamplesOnADay,
  setModelOutput,
}) => {
  const [sandboxMode, setSandboxMode] = useState<boolean>(false);
  let { modelInputs, metadataExample } = useContext(CreateInterfaceContext);

  const { post, loading, response } = useFetch();

  const onSubmission = async () => {
    modelInputs = {
      ...modelInputs,
      input_by_user: inputByUser,
    };
    // const stillAllowedToSubmit = await post(
    //   `/rounduserexample/still_allowed_to_submit`,
    //   {
    //     round_id: realRoundId,
    //     user_id: userId,
    //     max_amount_examples_on_a_day: maxAmountExamplesOnADay,
    //   },
    // )
    // if (!stillAllowedToSubmit) {
    //   Swal.fire({
    //     icon: 'warning',
    //     title: 'Oops...',
    //     text:
    //       'You have reached the maximum amount of examples you can submit today',
    //     confirmButtonColor: '#2088ef',
    //   })
    //   return
    // }
    if (
      neccessaryFields.every(
        (item) =>
          modelInputs.hasOwnProperty(item) ||
          metadataExample.hasOwnProperty(item)
      )
    ) {
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
      if (partialSampleId === 0) {
        const modelOutput = await post(
          `/model/single_model_prediction_submit`,
          finaModelInputs
        );
        setModelOutput(modelOutput);
      } else {
        const modelOutput = await post(
          `/example/update_creation_generative_example_by_example_id`,
          {
            example_id: partialSampleId,
            example_info: modelInputs,
            metadata_json: metadataExample,
          }
        );
        if (response.ok) {
          Swal.fire({
            icon: "success",
            title: "Success",
            text: "Your example has been saved",
            confirmButtonColor: "#2088ef",
          });
          window.location.reload();
          setModelOutput(modelOutput);
        } else {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Something went wrong! please contact task owner",
            confirmButtonColor: "#2088ef",
          });
        }
      }
    } else {
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        html: `Please fill the missing fields: <br/> ${neccessaryFields.filter(
          (field) => !modelInputs.hasOwnProperty(field)
        )}  `,
        confirmButtonColor: "#2088ef",
      });
    }
  };

  return (
    <>
      {!loading ? (
        <>
          {!isGenerativeContext && (
            <>
              <div className="col-span-1 py-4">
                <div className="grid grid-cols-6">
                  {accept_sandbox_creation && (
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
                  )}
                  <div className="flex justify-end col-span-3 ">
                    {accept_sandbox_creation && (
                      <div className="col-span-1 pl-2" id="switchContext">
                        {currentContext && partialSampleId !== 0 && (
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
                    )}

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
