import React, { FC } from "react";
import { Button } from "react-bootstrap";
import useFetch from "use-http";

type ExamplesCreatedProps = {
  taskId: number;
  s3Bucket?: string;
};

const ExamplesCreated: FC<ExamplesCreatedProps> = ({ taskId, s3Bucket }) => {
  const { post } = useFetch();

  const downloadExamples = async () => {
    const response = await post(`/task/download_created_examples`, {
      task_id: taskId,
    });
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "examples.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const downloadAdditionalData = async () => {
    const response = await post(`/task/download_additional_data`, {
      s3_bucket: s3Bucket,
    });
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "additional_data.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  return (
    <>
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
    </>
  );
};

export default ExamplesCreated;
