import React, { FC } from "react";
import { Button } from "react-bootstrap";
import { PacmanLoader } from "react-spinners";
import useFetch from "use-http";

type ExamplesCreatedProps = {
  taskId: number;
  s3Bucket?: string;
};

const ExamplesCreated: FC<ExamplesCreatedProps> = ({ taskId, s3Bucket }) => {
  const { post, response, loading } = useFetch();

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

  const downloadAdditionalData = async () => {
    const response = await post(`/example/download_additional_data`, {
      folder_direction: s3Bucket,
    });
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "bucket.zip");
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  return (
    <>
      {!loading ? (
        <div className="col-span-1 py-4">
          <div className="grid grid-cols-6">
            <div className="flex justify-end col-span-3 ">
              <div className="col-span-1 pl-2 pr-3" id="submit">
                <Button
                  className="border-0 font-weight-bold light-gray-bg task-action-btn"
                  onClick={() => downloadExamples()}
                >
                  Download examples
                </Button>
              </div>
              {s3Bucket && (
                <div className="col-span-1 pl-2 pr-3" id="submit">
                  <Button
                    className="border-0 font-weight-bold light-gray-bg task-action-btn"
                    onClick={() => downloadAdditionalData()}
                  >
                    Download additional data
                  </Button>
                </div>
              )}
            </div>
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
