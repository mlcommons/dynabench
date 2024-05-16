import CreateInterfaceHelpersButton from "new_front/components/Buttons/CreateInterfaceHelpersButton";
import AnnotationTitle from "new_front/components/CreateSamples/CreateSamples/AnnotationTitle";
import ValidationContextStrategy from "new_front/components/CreateSamples/ValidateSamples/AnnotationInterfaces/Contexts/ValidationContextStrategy";
import ValidationUserInputStrategy from "new_front/components/CreateSamples/ValidateSamples/AnnotationInterfaces/UserInput/ValidationUserInputStrategy";
import ValidationButtonActions from "new_front/components/CreateSamples/ValidateSamples/ValidationButtonActions";
import React, { FC, useContext, useState, useEffect } from "react";
import { OverlayContext } from "new_front/components/OverlayInstructions/Provider";
import useFetch from "use-http";
import { useHistory, useParams } from "react-router-dom";
import { ValidationConfigurationTask } from "new_front/types/createSamples/createSamples/configurationTask";
import UserContext from "containers/UserContext";
import { checkUserIsLoggedIn } from "new_front/utils/helpers/functions/LoginFunctions";
import { PacmanLoader } from "react-spinners";
import RadioButton from "new_front/components/Lists/RadioButton";
import { ExampleInfoType } from "new_front/types/createSamples/validateSamples/exampleInfo";
import Swal from "sweetalert2";

const ValidateSamples: FC = () => {
  const [taskInfoName, setTaskInfoName] = useState<string>("");
  const [validateNonFooling, setValidateNonFooling] = useState<boolean>(false);
  const [roundId, setRoundId] = useState<number>(0);
  const [label, setLabel] = useState<string>("");
  const { get, post, response, loading } = useFetch();
  const [generalInstructions, setGeneralInstructions] = useState<string>("");
  const [metadataExample, setMetadataExample] = useState<object>({});
  const [infoExampleToValidate, setInfoExampleToValidate] =
    useState<ExampleInfoType>();
  const [validationConfigInfo, setValidationConfigInfo] =
    useState<ValidationConfigurationTask>();
  const { hidden, setHidden } = useContext(OverlayContext);
  const { user } = useContext(UserContext);

  let { taskCode } = useParams<{ taskCode: string }>();
  const history = useHistory();

  const updateMetadataExample = (input: object) => {
    setMetadataExample((prevMetadataValidation) => {
      return { ...prevMetadataValidation, ...input };
    });
  };

  const loadTaskContextData = async () => {
    const taskId = await get(`/task/get_task_id_by_task_code/${taskCode}`);
    const [validationConfigInfo, taskInfo] = await Promise.all([
      get(`/example/get_validate_configuration?task_id=${taskId}`),
      get(`/task/get_task_with_round_info_by_task_id/${taskId}`),
    ]);
    const example = await post("/example/get_example_to_validate", {
      real_round_id: taskInfo?.round.id,
      user_id: user.id,
      num_matching_validations: taskInfo?.num_matching_validations,
      validate_non_fooling: Boolean(taskInfo?.validate_non_fooling),
      task_id: taskId,
    });
    if (response.ok) {
      setTaskInfoName(taskInfo?.task_name);
      setRoundId(taskInfo?.round.id);
      setValidateNonFooling(Boolean(taskInfo?.validate_non_fooling));
      setValidationConfigInfo(validationConfigInfo);
    }
    console.log("example", example);

    if (example.example_id) {
      setInfoExampleToValidate(example);
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "There are no examples to validate",
      });
    }
  };

  const isLogin = async () => {
    if (!user.id) {
      await checkUserIsLoggedIn(history, `/`, null, null);
    }
  };

  useEffect(() => {
    isLogin();
  }, [user]);

  const handleData = async () => {
    const isLogin = await checkUserIsLoggedIn(
      history,
      `/tasks/${taskCode}/validate`,
      null,
      null,
    );
    if (isLogin) {
      loadTaskContextData();
    }
  };

  useEffect(() => {
    if (user.id) {
      handleData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  return (
    <>
      {loading ||
      !validationConfigInfo ||
      !infoExampleToValidate?.example_id ? (
        <div className="flex items-center justify-center h-screen">
          <PacmanLoader color="#ccebd4" loading={loading} size={50} />
        </div>
      ) : (
        <div className="container">
          <div id="title">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <AnnotationTitle
                  taskName={taskInfoName}
                  subtitle="Validate examples"
                />
              </div>
              <div className="flex items-start justify-end pr-4 pt-14">
                <CreateInterfaceHelpersButton
                  generalInstructions={generalInstructions}
                  realRoundId={roundId}
                  userId={user.id}
                />
              </div>
            </div>
          </div>
          <div className="p-3 border-2">
            {validationConfigInfo.validation_context && (
              <div id="context" className="rounded">
                <ValidationContextStrategy
                  config={validationConfigInfo?.validation_context as any}
                  task={{}}
                  infoExampleToValidate={infoExampleToValidate.context_info}
                  onInputChange={updateMetadataExample}
                  hidden={hidden}
                />
              </div>
            )}
            <RadioButton
              instructions="Actions"
              options={["👍 Correct", "👎 Incorrect", "🚩 Flag"]}
              field_name_for_the_model="label"
              onInputChange={(input) => {
                setLabel(input.label);
              }}
            />
            {validationConfigInfo.validation_user_input && (
              <div id="inputUser" className="">
                <ValidationUserInputStrategy
                  config={validationConfigInfo?.validation_user_input as any}
                  task={{}}
                  onInputChange={updateMetadataExample}
                  hidden={hidden}
                />
              </div>
            )}
            <div>
              <ValidationButtonActions
                exampleId={infoExampleToValidate.example_id}
                userId={infoExampleToValidate.user_id}
                label={label
                  .toLowerCase()
                  .replace(
                    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
                    "",
                  )
                  .replace(" ", "")}
                metadataExample={metadataExample}
                taskId={infoExampleToValidate.task_id}
                validateNonFooling={validateNonFooling}
                roundId={roundId}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ValidateSamples;
