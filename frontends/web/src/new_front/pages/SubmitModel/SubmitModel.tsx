import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { PacmanLoader } from "react-spinners";
import { Button } from "react-bootstrap";
import useFetch from "use-http";
import Swal from "sweetalert2";

import useUploadFile from "./useUploadFile";
import useStartMultipart from "./useUploadHeavyFile";
import CreateModel from "new_front/pages/SubmitModel/CreateModel";
import ProgressBar from "new_front/components/Buttons/ProgressBar";
import UserContext from "containers/UserContext";
import { checkUserIsLoggedIn } from "new_front/utils/helpers/functions/LoginFunctions";
import { LanguagePair } from "new_front/types/uploadModel/uploadModel";

const yaml = require("js-yaml");

const SubmitModel = () => {
  const [loading, setLoading] = useState({
    loading: true,
    text: "Done",
  });
  const [loadingFile, setLoadingFile] = useState(false);
  const { progress, sendModelData, sendHFmodel } = useUploadFile();
  const { bigProgress, getSignedURLS } = useStartMultipart();
  const [firstRenderLoading, setFirstRenderLoading] = useState(true);
  const [showHuggingFace, setShowHuggingFace] = useState(false);
  const [showDynalab, setShowDynalab] = useState(false);
  const [includeDynalab, setIncludeDynalab] = useState(true);
  const [hfModel, setHfModel] = useState(false);
  const [languagePairs, setLanguagePairs] = useState<LanguagePair[]>([]);
  const [configYaml, setConfigYaml] = useState<any>();
  const [dynalabModel, setDynalabModel] = useState<string>();
  const { user, api } = useContext(UserContext);
  const history = useHistory();
  let { taskCode } = useParams<{ taskCode: string }>();
  const { get, response } = useFetch();

  const isLogin = async (taskCode: string) => {
    if (!user.id) {
      await checkUserIsLoggedIn(history, `/uploadModel`, null, taskCode);
    }
  };

  const checkApiLogin = async (): Promise<boolean> => {
    try {
      const loginResult = api.loggedIn();

      // Handle both synchronous boolean and Promise<boolean>
      const isLoggedIn =
        loginResult instanceof Promise ? await loginResult : loginResult;

      return isLoggedIn;
    } catch (error) {
      console.error("Error checking login status:", error);
      return false;
    }
  };

  const handleSubmitModel = async (modelData: any) => {
    const isLoggedIn = await checkApiLogin();

    if (!isLoggedIn) {
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Your session has expired. Please login again to continue.",
        confirmButtonColor: "#007bff",
      }).then(() => {
        history.push("/login");
      });
      return;
    }
    if (modelData.file && modelData.file.length !== 0) {
      setLoading({
        loading: false,
        text: "Your model is being uploaded.",
      });
      const formData = new FormData();
      formData.append("model_name", modelData.modelName);
      formData.append("description", modelData.desc);
      formData.append("num_paramaters", modelData.numParams);
      formData.append("languages", modelData.languages);
      formData.append("license", modelData.license);
      formData.append("file_name", modelData.file.name);
      formData.append("user_id", user.id);
      formData.append("task_code", taskCode);
      formData.append("file_to_upload", modelData.file);

      const THRESHOLD = 4 * 1024 * 1024 * 1024; //4GB

      if (
        configYaml.evaluation?.type === "heavy" &&
        modelData.file.size > THRESHOLD
      ) {
        const chunkSize = 1 * 1024 * 1024 * 100; // 100MB
        const partsCount = Math.ceil(modelData.file.size / chunkSize); //10MB
        const data = {
          model_name: modelData.modelName,
          file_name: modelData.file.name,
          content_type: modelData.file.type,
          user_id: user.id,
          task_code: taskCode,
          parts_count: partsCount,
        };
        getSignedURLS(formData, modelData.file, data, chunkSize).then(
          (succeed) => {
            setLoading({ loading: true, text: "Done" });
            if (succeed) {
              Swal.fire({
                title: "Good job!",
                text: "Your model will be uploaded and soon you will be able to see the results in the dynaboard (you will receive an email!)",
                icon: "success",
                confirmButtonColor: "#007bff",
              });
            } else {
              Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Something went wrong!",
              });
            }
          },
        );
      } else {
        sendModelData(formData, configYaml.evaluation?.type === "heavy")
          .then((result) => {
            setLoading({ loading: true, text: "Done" });
            if (result && result.success) {
              Swal.fire({
                title: "Good job!",
                text: "Your model will be uploaded and soon you will be able to see the results in the dynaboard (you will receive an email!)",
                icon: "success",
                confirmButtonColor: "#007bff",
              });
            } else {
              console.error("upload failed", result?.message);
              setLoading({ loading: true, text: "Upload Failed" });
            }
          })
          .catch((e) => {
            console.error("Unexpected error", e);
            setLoading({ loading: true, text: "Upload Failed" });
            Swal.fire({
              icon: "error",
              title: "Unexpected Error",
              text: "An Unexpected error occurred. Please try again.",
            });
          });
      }
    } else {
      if (hfModel && !includeDynalab) {
        setLoading({
          loading: false,
          text: "Your model is being uploaded.",
        });
        const formData = new FormData();
        formData.append("model_name", modelData.modelName);
        formData.append("description", modelData.desc);
        formData.append("num_paramaters", modelData.numParams);
        formData.append("languages", modelData.languages);
        formData.append("license", modelData.license);
        formData.append("user_id", user.id);
        formData.append("task_code", taskCode);
        formData.append("repo_url", modelData.repoUrl);
        formData.append("hf_api_token", modelData.hfApiToken);
        sendHFmodel(formData)
          .then((result) => {
            setLoading({ loading: true, text: "Done" });
            if (result && result.success) {
              Swal.fire({
                title: "Good job!",
                text: "Your model will be uploaded and soon you will be able to see the results in the dynaboard (you will receive an email!)",
                icon: "success",
                confirmButtonColor: "#007bff",
              });
            } else {
              console.error("upload failed", result?.message);
              setLoading({ loading: true, text: "Upload Failed" });
            }
          })
          .catch((e) => {
            console.error("Unexpected error", e);
            setLoading({ loading: true, text: "Upload Failed" });
            Swal.fire({
              icon: "error",
              title: "Unexpected Error",
              text: "An Unexpected error occurred. Please try again.",
            });
          });
      } else {
        setLoadingFile(true);
        Swal.fire({
          icon: "warning",
          title: "No File Selected",
          text: "Please upload a model file before submitting.",
        });
        setLoading({ loading: true, text: "Done" });
      }
    }
  };

  const getTaskData = async () => {
    const taskId = await get(`/task/get_task_id_by_task_code/${taskCode}`);
    const taskData = await get(
      `/task/get_task_with_round_info_by_task_id/${taskId}`,
    );
    const dynalabModel = await get(`/model/get_dynalab_model/${taskCode}`);
    if (response.ok) {
      setConfigYaml(
        JSON.parse(JSON.stringify(yaml.load(taskData.config_yaml))),
      );
      setDynalabModel(dynalabModel);
      setFirstRenderLoading(false);
    }
  };

  useEffect(() => {
    isLogin(taskCode);
    if (user.id) {
      getTaskData();
    }
  }, [user]);

  useEffect(() => {
    if (configYaml) {
      if (configYaml?.submit_config) {
        if ("allow_hf" in Object(configYaml.submit_config)) {
          setHfModel(configYaml.submit_config.allow_hf);
        }
        if ("languages_options" in Object(configYaml.submit_config)) {
          setLanguagePairs(configYaml.submit_config.languages_options);
        }
        if ("include_dynalab" in Object(configYaml.submit_config)) {
          setIncludeDynalab(configYaml.submit_config.include_dynalab);
        }
      } else {
        setHfModel(false);
      }
    }
  }, [configYaml]);

  return (
    <>
      {loading.loading && configYaml ? (
        <div className="container mb-6">
          <div className="flex flex-col items-center justify-center pt-8">
            <h1 className="text-3xl font-bold">Submit Model</h1>
            <p className="pt-3 text-lg">
              What type of model do you want to upload?
            </p>
          </div>
          <div
            className={`grid gap-6 ${
              hfModel && includeDynalab ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {hfModel && (
              <div className="flex flex-col items-center justify-center mt-4 border-2 border-gray-200 rounded-md">
                <h3 className="pt-4 text-xl font-semibold">Hugging Face 🤗</h3>
                <p className="text-lg">Upload a model from Hugging Face</p>
                <span className="pt-2 pb-4 text-gray-400">
                  Here you can find the instructions to upload a model from
                  Hugging Face
                </span>
                {showHuggingFace ? (
                  <CreateModel
                    isDynalab={false}
                    handleClose={() => setShowHuggingFace(false)}
                    handleSubmitModel={handleSubmitModel}
                  />
                ) : (
                  <Button
                    onClick={() => setShowHuggingFace(!showHuggingFace)}
                    className="mb-4 border-0 font-weight-bold light-gray-bg btn-primary"
                  >
                    <i className="fas fa-edit "></i> Upload model
                  </Button>
                )}
              </div>
            )}
            {includeDynalab && (
              <div className="flex flex-col items-center justify-center mt-4 border-2 border-gray-200 rounded-md">
                <h3 className="pt-4 text-xl font-semibold">Dynalab</h3>
                <p className="text-lg">Upload a Dynalab model</p>
                <span className="pt-2 pb-2 text-gray-400">
                  <a
                    href="https://docs.dynabench.org/docs/dynalab/upload_a_model"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500"
                  >
                    Here
                  </a>{" "}
                  you can find the instructions to create a Dynalab model
                </span>
                <span className="pb-4 text-gray-400">
                  You can download the base model{" "}
                  <a
                    href={dynalabModel}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500"
                  >
                    here
                  </a>
                </span>
                {showDynalab ? (
                  <CreateModel
                    isDynalab={true}
                    languagePairs={languagePairs}
                    handleClose={() => setShowDynalab(false)}
                    handleSubmitModel={handleSubmitModel}
                  />
                ) : (
                  <Button
                    onClick={() => setShowDynalab(!showDynalab)}
                    className="mb-4 border-0 font-weight-bold light-gray-bg btn-primary"
                  >
                    <i className="fas fa-edit "></i> Upload model
                  </Button>
                )}
                <span className="pb-4 text-red-400">
                  Please refrain from renaming the files and directories of the
                  downloadable zip base file
                </span>
                <span className="pb-4 text-gray-400">
                  This may affect our pipeline thus your scoring
                </span>
              </div>
            )}
          </div>
        </div>
      ) : firstRenderLoading ? (
        <div className="flex items-center justify-center h-screen">
          <PacmanLoader
            color="#ccebd4"
            loading={firstRenderLoading}
            size={50}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-screen">
          <ProgressBar progress={progress || bigProgress} text={loading.text} />
        </div>
      )}
    </>
  );
};

export default SubmitModel;
