import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

interface partObject {
  ETag: string;
  PartNumber: number;
}

interface UploadResult {
  success: boolean;
  message: string;
  error?: any;
}

const useUploadHeavyFile = () => {
  const [bigProgress, setProgress] = useState(0);
  const baseURL = process.env.REACT_APP_API_HOST_2;
  const token = localStorage.getItem("id_token") || "";
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

  const handleError = (error: any, operation: string): UploadResult => {
    setProgress(0);

    let errorMessage = "Something went wrong!";
    let errorTitle = "Upload Failed";
    let onCloseAction = false;

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          errorTitle = "Invalid Request";
          errorMessage =
            data?.message ||
            "The upload request is invalid. Please check your file and try again.";
          break;
        case 401:
          errorTitle = "Authentication Required";
          errorMessage =
            "Your session has expired. Please log in again to continue.";
          onCloseAction = true;
          break;
        case 500:
          errorTitle = "Server Error";
          errorMessage = `Server error during ${operation}. Please try again later.`;
          break;
        default:
          errorMessage =
            data?.message ||
            `Upload failed during ${operation} (${status}). Please try again.`;
      }
    } else if (error.request) {
      errorTitle = "Connection Error";
      errorMessage = `Unable to connect to the server during ${operation}. Please check your internet connection.`;
    } else if (error.code === "ECONNABORTED") {
      errorTitle = "Upload Timeout";
      errorMessage = `The ${operation} is taking too long. Please try again.`;
    } else {
      errorTitle = "Unexpected Error";
      errorMessage =
        error.message || `An unexpected error occurred during ${operation}.`;
    }

    Swal.fire({
      icon: "error",
      title: errorTitle,
      text: errorMessage,
      willClose: () => {
        if (onCloseAction) {
          localStorage.removeItem("id_token");
          window.location.href = "/login";
        }
      },
    });

    return {
      success: false,
      error: error,
      message: errorMessage,
    };
  };

  const getSignedURLS = (
    formData: FormData,
    file: File,
    data: object,
    chunkSize: number,
  ) => {
    const url = `${baseURL}/model/initiate-mutipart-upload`;
    setProgress(0);
    return axios
      .request({
        method: "post",
        url: url,
        data: data,
      })
      .then((response) => {
        const { upload_id, urls, model_id } = response.data;
        return uploadFileChunks(
          formData,
          file,
          data,
          urls,
          upload_id,
          model_id,
          chunkSize,
        );
      })
      .catch((e) => {
        console.error("Failed to get signed URLS", e);
        handleError(e, "Multipart upload initiation");
        setProgress(0);
        return false;
      });
  };

  const uploadFileChunks = (
    formData: FormData,
    file: File,
    data: any,
    urls: [],
    uploadId: string,
    modelId: string,
    chunkSize: number,
  ) => {
    const localParts: partObject[] = [];
    const BATCH_SIZE = 100;
    const abortParams = {
      upload_id: uploadId,
      model_name: formData.get("model_name"),
      file_name: formData.get("file_name"),
      user_id: formData.get("user_id"),
      task_code: formData.get("task_code"),
      model_id: modelId,
    };
    let uploadFailed = false;
    const uploadProgresschunk = 1 / urls.length;

    function processBatch(batchIndex: number): Promise<boolean> {
      if (batchIndex >= urls.length || uploadFailed) {
        if (uploadFailed) {
          console.error(
            "Aborting multipart upload due to part upload failure.",
          );
          return abortUpload(abortParams).then(() => false);
        }
        return completeUpload(
          formData,
          uploadId,
          modelId,
          localParts,
          abortParams,
        ).then(() => true);
      }

      const batch = urls.slice(batchIndex, batchIndex + BATCH_SIZE);
      const promises = [];

      for (let i = 0; i < batch.length; i++) {
        const globalIndex = batchIndex + i;
        const start = globalIndex * chunkSize;
        const chunk = file?.slice(start, start + chunkSize);
        const promise = fetch(urls[globalIndex], {
          method: "PUT",
          body: chunk,
          headers: {
            "Content-Type": file.type,
          },
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(`Failed to upload part ${i + 1}`);
            }
            const etag = response.headers.get("ETag");
            if (!etag) {
              throw new Error(`ETag missing for part ${i + 1}`);
            }
            localParts.push({
              ETag: etag,
              PartNumber: globalIndex + 1,
            });
            setProgress((prevState) => prevState + uploadProgresschunk);
            return false;
          })
          .catch((err) => {
            console.error(`Failed to upload part ${i + 1}: ${err.message}`);
            uploadFailed = true;
            Swal.fire({
              icon: "error",
              title: "Chunk Upload Failed",
              text: err.message,
              confirmButtonText: "OK",
            });
            return false;
          });

        promises.push(promise);
      }

      return Promise.all(promises).then(() =>
        processBatch(batchIndex + BATCH_SIZE),
      );
    }

    return processBatch(0);
  };

  const completeUpload = (
    formData: FormData,
    uploadID: string,
    modelId: string,
    currentParts: partObject[],
    abortParams: any,
  ) => {
    const url = `${baseURL}/model/complete-multipart-upload`;
    const params = {
      model_name: formData.get("model_name"),
      file_name: formData.get("file_name"),
      user_id: formData.get("user_id"),
      task_code: formData.get("task_code"),
      upload_id: uploadID,
      model_id: modelId,
      parts: currentParts,
    };
    return axios
      .request({
        method: "post",
        url: url,
        data: params,
      })
      .then(() => {
        setProgress(1);
        return true;
      })
      .catch((e) => {
        console.error("There was an error while completing upload", e);
        abortUpload(abortParams);
        handleError(e, "upload completion");
        return false;
      });
  };

  const abortUpload = (params: any): Promise<void> => {
    const url = `${baseURL}/model/abort-mutipart-upload`;
    setProgress(0);
    return axios
      .request({
        method: "post",
        url: url,
        data: params,
      })
      .then(() => {
        console.log("Multipart upload aborted successfully.");
      })
      .catch((err) => {
        console.error("Failed to abort multipart upload:", err.message);
      })
      .then(() => Promise.resolve());
  };

  return { bigProgress, getSignedURLS };
};

export default useUploadHeavyFile;
