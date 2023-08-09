import React, { FC, useState, useEffect } from "react";
import { ReactComponent as Model } from "new_front/assets/model.svg";
import { AllModelsInfo } from "new_front/types/model/modelInfo";
import useFetch from "use-http";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { Button } from "react-bootstrap";
import UpdateModelInfo from "new_front/components/Modals/UpdateModelInfo";
import Modal from "react-bootstrap/Modal";
import { PacmanLoader } from "react-spinners";

type ModelOverviewProps = {
  modelId?: number;
};

const ModelOverview: FC<ModelOverviewProps> = () => {
  const { modelId } = useParams<{ modelId: string }>();

  const [showUpdateModelInfo, setShowUpdateModelInfo] = useState(false);
  const [modelInfo, setModelInfo] = useState<AllModelsInfo>(
    {} as AllModelsInfo
  );
  const { get, response, loading } = useFetch();

  const getModelInfo = async () => {
    const modelInfo = await get(`/model/get_all_model_info_by_id/${modelId}`);
    if (response.ok) {
      if (!modelInfo) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "This models does not exist!",
        });
      } else {
        setModelInfo(modelInfo);
      }
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
      });
    }
  };

  const updateModelStatus = async () => {
    await get(`/model/update_model_status/${modelId}`);
    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Model status updated successfully",
      }).then(() => {
        window.location.reload();
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Model is missing all the scores!",
      });
    }
  };

  useEffect(() => {
    if (modelId) {
      getModelInfo();
    }
    console.log(modelId);
  }, [modelId]);

  return (
    <>
      {!loading && Object.keys(modelInfo).length !== 0 ? (
        <>
          <Modal
            show={showUpdateModelInfo}
            onHide={() => setShowUpdateModelInfo(false)}
          >
            <UpdateModelInfo
              modelId={parseInt(modelId)}
              handleClose={() => setShowUpdateModelInfo(false)}
              name={modelInfo.name}
              desc={modelInfo.desc}
              longdesc={modelInfo.longdesc}
              params={modelInfo.params}
              languages={modelInfo.languages}
              license={modelInfo.license}
              source_url={modelInfo.source_url}
            />
          </Modal>
          <div className="bg-gradient-to-b from-white to-[#ccebd44d] flex flex-col justify-center h-screen ">
            <div className="relative flex flex-col max-w-xs p-16 mx-auto space-y-3 bg-white border border-white shadow-lg md:flex-row md:space-x-5 md:space-y-0 rounded-xl md:max-w-4xl">
              <div className="grid w-full md:w-1/3 place-items-center">
                <Model className="w-full h-full" />
              </div>
              <div className="flex flex-col w-full p-3 space-y-2 bg-white md:w-2/3">
                <div className="flex justify-between item-center">
                  <p className="hidden font-bold text-letter-color md:block">
                    {modelInfo.upload_datetime.substring(0, 10)}
                  </p>
                  <div className="flex items-center">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-7 h-7 "
                    >
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></g>
                      <g id="SVGRepo_iconCarrier">
                        {" "}
                        <path
                          d="M14.2718 10.445L18 2M9.31612 10.6323L5 2M12.7615 10.0479L8.835 2M14.36 2L13.32 4.5M6 16C6 19.3137 8.68629 22 12 22C15.3137 22 18 19.3137 18 16C18 12.6863 15.3137 10 12 10C8.68629 10 6 12.6863 6 16Z"
                          stroke="#2088ef"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>{" "}
                        <path
                          d="M10.5 15L12.5 13.5V18.5"
                          stroke="#2088ef"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>{" "}
                      </g>
                    </svg>
                    <p className="ml-1 text-sm font-bold text-letter-color">
                      {modelInfo.score.toFixed(2)} &nbsp;
                      <span className="font-normal text-letter-color">
                        (General score)
                      </span>
                    </p>
                  </div>

                  <div
                    className={`${
                      modelInfo.deployment_status === "deployed"
                        ? "bg-primary-color "
                        : "bg-secondary-color text-white"
                    } px-3 py-1 rounded-full text-sm font-medium text-letter-color hidden md:block capitalize`}
                  >
                    {modelInfo.deployment_status}
                  </div>
                </div>
                <h3 className="text-xl font-black capitalize text-letter-color md:text-3xl">
                  {modelInfo.name}
                </h3>
                <p className="text-lg text-letter-color">{modelInfo.desc}</p>
                <p className="text-base text-letter-color">
                  {modelInfo.longdesc}
                </p>
                <h6>
                  <span className="text-xl font-bold text-letter-color">
                    Data
                  </span>
                </h6>
                <ul className="grid grid-cols-2 gap-2  text-letter-color">
                  <li>
                    <strong>Community:</strong> {modelInfo.community}
                  </li>
                  <li>
                    <strong>Task:</strong> {modelInfo.task}
                  </li>
                  <li>
                    <strong>Params:</strong> {modelInfo.params}
                  </li>
                  <li>
                    <strong>Languagues:</strong> {modelInfo.languages}
                  </li>
                  <li>
                    <strong>License:</strong> {modelInfo.license}
                  </li>
                  <li>
                    <strong>Paper:</strong> {modelInfo.source_url}
                  </li>
                </ul>
                <div className="flex items-center justify-between gap-2 pt-8">
                  <Button
                    onClick={() => setShowUpdateModelInfo(true)}
                    className="px-4 text-lg font-semibold border-0 bg-primary-color"
                  >
                    Update
                  </Button>
                  {/* <Button className="px-4 text-lg font-medium text-white border-0 bg-letter-color hover:bg-letter-color hover:text-white">
                    Predictions
                  </Button> */}
                  <Button
                    onClick={updateModelStatus}
                    className={`${
                      !modelInfo.is_published
                        ? "hover:bg-third-color bg-third-color "
                        : "bg-secondary-color hover:bg-secondary-color"
                    } px-4 text-lg border-0 font-medium text-white hover:text-white`}
                  >
                    {!modelInfo.is_published ? "Publish" : "Unpublish"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-32">
          <PacmanLoader color="#ccebd4" loading={loading} size={50} />
        </div>
      )}
    </>
  );
};

export default ModelOverview;
