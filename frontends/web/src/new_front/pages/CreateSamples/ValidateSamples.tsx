import CreateInterfaceHelpersButton from "new_front/components/Buttons/CreateInterfaceHelpersButton";
import AnnotationTitle from "new_front/components/CreateSamples/CreateSamples/AnnotationTitle";
import ValidationContextStrategy from "new_front/components/CreateSamples/ValidateSamples/AnnotationInterfaces/Contexts/ValidationContextStrategy";
import ValidationUserInputStrategy from "new_front/components/CreateSamples/ValidateSamples/AnnotationInterfaces/UserInput/ValidationUserInputStrategy";
import React, { FC, useContext, useState, useEffect } from "react";
import { OverlayContext } from "new_front/components/OverlayInstructions/Provider";
import ValidationButtonActions from "new_front/components/CreateSamples/ValidateSamples/AnnotationInterfaces/ValidationButtonActions";
import useFetch from "use-http";
import { useHistory, useParams } from "react-router-dom";
import { ValidationConfigurationTask } from "new_front/types/createSamples/createSamples/configurationTask";
import UserContext from "containers/UserContext";
import { isLogin } from "new_front/utils/helpers/functions/LoginFunctions";

const ValidateSamples: FC = () => {
  const [taskInfoName, setTaskInfoName] = useState<string>("");
  const { get, post, response, loading } = useFetch();
  const [generalInstructions, setGeneralInstructions] = useState<string>("");
  const [metadataValidation, setMetadataValidation] = useState<object>({});
  const [realRoundId, setRealRoundId] = useState<number>(0);
  const [numMatchingValidations, setNumMatchingValidations] =
    useState<number>(0);
  const [validateNonFooling, setValidateNonFooling] = useState<boolean>(false);
  const [infoExampleToValidate, setInfoExampleToValidate] = useState<object>(
    {}
  );
  const [validationConfiguration, setValidationConfiguration] =
    useState<ValidationConfigurationTask>();
  const { hidden, setHidden } = useContext(OverlayContext);
  const { user } = useContext(UserContext);
  let { taskCode } = useParams<{ taskCode: string }>();
  const history = useHistory();

  const updateMetadataValidation = (input: object) => {
    setMetadataValidation((prevMetadataValidation) => {
      return { ...prevMetadataValidation, ...input };
    });
  };

  const loadTaskContextData = async () => {
    const taskId = await get(`/task/get_task_id_by_task_code/${taskCode}`);
    const [validationConfigInfo, taskInfo] = await Promise.all([
      get(`/example/get_validate_configuration?task_id=${taskId}`),
      get(`/task/get_task_with_round_info_by_task_id/${taskId}`),
    ]).then();
    if (response.ok) {
      setTaskInfoName(taskInfo.task_name);
      setRealRoundId(taskInfo.round.id);
      setNumMatchingValidations(taskInfo.num_matching_validations);
      setValidateNonFooling(taskInfo.validate_non_fooling);
      setValidationConfiguration(validationConfigInfo);
    }
    const infoExampleToValidate = await post(
      "/example/get_example_to_validate",
      {
        real_round_id: realRoundId,
        user_id: user.id,
        num_matching_validations: numMatchingValidations,
        validate_non_fooling: validateNonFooling,
      }
    );
    if (response.ok) {
      setInfoExampleToValidate(infoExampleToValidate);
    }
  };

  const userIsLoggedIn = async () => {
    const login = await isLogin();
    if (!login) {
      history.push(
        "/login?msg=" +
          encodeURIComponent(
            "Please sign up or log in so that you can upload a model"
          ) +
          "&src=" +
          encodeURIComponent(`/tasks/${taskCode}/create`)
      );
    }
  };

  useEffect(() => {
    userIsLoggedIn();
    loadTaskContextData();
  }, []);

  return (
    <>
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
              />
            </div>
          </div>
        </div>
        <div className="border-2 p-3">
          <div id="context" className="rounded">
            <ValidationContextStrategy
              config={validationConfiguration?.validation_context as any}
              task={{}}
              responseModel={infoExampleToValidate}
              onInputChange={updateMetadataValidation}
              hidden={hidden}
            />
          </div>
          <div id="inputUser" className="">
            <ValidationUserInputStrategy
              config={validationConfiguration?.validation_user_input as any}
              task={{}}
              onInputChange={updateMetadataValidation}
              hidden={hidden}
            />
          </div>
          <div>
            <ValidationButtonActions />
          </div>
        </div>
      </div>
    </>
  );
};

export default ValidateSamples;
