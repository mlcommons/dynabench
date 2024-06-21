import React, { FC } from "react";
import { Button } from "react-bootstrap";
import { PacmanLoader } from "react-spinners";
import useFetch from "use-http";
import Swal from "sweetalert2";

type ExamplesCreatedProps = {
  taskId: number;
  s3Bucket?: string;
};

const ExamplesCreated: FC<ExamplesCreatedProps> = ({ taskId, s3Bucket }) => {
  const { post, get, response, loading } = useFetch();

  const downloadExamples = async () => {
    await post(`/example/download_all_created_examples`, {
      task_id: taskId,
    });
    if (response.ok) {
      response.blob().then((blob) => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${taskId}_examples_created.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
    }
  };

  const downloadModelResults = async () => {
    await post(`/model/download_model_results`, {
      task_id: taskId,
    });
    if (response.ok) {
      response.blob().then((blob) => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${taskId}_model_results.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
    }
  };

  const downloadUsersInfo = async () => {
    await get(`/user/download_users_info`);
    if (response.ok) {
      response.blob().then((blob) => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${taskId}_users_info.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
    }
  };

  const downloadAdditionalData = async () => {
    const urlSigned = await post(`/example/download_additional_data`, {
      folder_direction: s3Bucket,
    });
    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "Success",
        text: `Here you can download the additional data: ${urlSigned}`,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
      });
    }
  };

  return (
    <>
      {!loading ? (
        <div className="md:col-span-2 col-span-1 py-4">
          <div className="flex flex-wrap md:flex-none grid items-center justify-center lg:grid-cols-7 md:grid-cols-4 grid-cols-4">
            <div
              className="col-span-2 sm:col-span-1 pb-2 sm:pb-0 pl-2 pr-3 min-w-40"
              id="submit"
            >
              <Button
                className="border-0 font-weight-bold light-gray-bg task-action-btn"
                onClick={() => downloadExamples()}
              >
                Download examples
              </Button>
            </div>
            {s3Bucket && (
              <div
                className="col-span-2 sm:col-span-1 pb-2 sm:pb-0 pl-2 pr-3 min-w-40"
                id="submit"
              >
                <Button
                  className="border-0 font-weight-bold light-gray-bg task-action-btn"
                  onClick={() => downloadAdditionalData()}
                >
                  Download additional data
                </Button>
              </div>
            )}
            <div
              className="col-span-2 sm:col-span-1 pb-2 sm:pb-0 pl-2 pr-3 min-w-40"
              id="submit"
            >
              <Button
                className="border-0 font-weight-bold light-gray-bg task-action-btn"
                onClick={() => downloadModelResults()}
              >
                Download model results
              </Button>
            </div>
            {taskId === 45 && (
              <div
                className="col-span-2 sm:col-span-1 pb-2 sm:pb-0 pl-2 pr-3 min-w-40"
                id="submit"
              >
                <Button
                  className="border-0 font-weight-bold light-gray-bg task-action-btn"
                  onClick={() => downloadUsersInfo()}
                >
                  Download users info
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid items-center justify-center grid-rows-2">
          <div className="mr-2 text-letter-color">
            Data is being prepared, please wait...
          </div>
          <PacmanLoader
            color="#ccebd4"
            loading={loading}
            size={50}
            className="align-center"
          />
        </div>
      )}
    </>
  );
};

export default ExamplesCreated;
