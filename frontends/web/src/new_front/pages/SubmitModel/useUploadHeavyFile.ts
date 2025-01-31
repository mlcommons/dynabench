import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

interface partObject {
  ETag: string;
  PartNumber: number;
}

const useUploadHeavyFile = () => {
  const [bigProgress, setProgress] = useState(0);
  const baseURL = process.env.REACT_APP_API_HOST_2;

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
        const { upload_id, urls } = response.data;
        return uploadFileChunks(
          formData,
          file,
          data,
          urls,
          upload_id,
          chunkSize,
        );
      })
      .catch((e) => {
        console.error("Faile to get signed URLS", e);
        setProgress(0);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
        });
      });
  };

  const uploadFileChunks = (
    formData: FormData,
    file: File,
    data: any,
    urls: [],
    uploadId: string,
    chunkSize: number,
  ) => {
    const localParts: partObject[] = [];
    const promises: Promise<void>[] = [];
    const abortParams = {
      upload_id: uploadId,
      model_name: formData.get("model_name"),
      file_name: formData.get("file_name"),
      user_id: formData.get("user_id"),
      task_code: formData.get("task_code"),
    };
    let uploadFailed = false;

    const uploadProgresschunk = 1 / urls.length;
    for (let i = 0; i < urls.length; i++) {
      const start = i * chunkSize;
      const chunk = file?.slice(start, start + chunkSize);
      const promise = axios
        .request({
          method: "put",
          url: urls[i],
          data: chunk,
          headers: {
            "Content-Type": file.type,
          },
        })
        .then((response) => {
          localParts.push({
            ETag: response.headers.etag,
            PartNumber: i + 1,
          });
          setProgress((prevState) => prevState + uploadProgresschunk);
        })
        .catch((err) => {
          console.error(`Failed to upload part ${i + 1}: ${err.message}`);
          uploadFailed = true;
        });

      promises.push(promise);
    }

    return Promise.all(promises)
      .then(() => {
        if (uploadFailed) {
          console.error(
            "Aborting multipart upload due to part upload failure.",
          );
          abortUpload(abortParams);
          return;
        }
        return completeUpload(formData, uploadId, localParts, abortParams);
      })
      .catch((err) => {
        console.error("An error occurred during the upload:", err);
      })
      .then();
  };

  const completeUpload = (
    formData: FormData,
    uploadID: string,
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
        setProgress(0);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
        });
      });
  };

  const abortUpload = (params: any) => {
    const url = `${baseURL}/model/abort-mutipart-upload`;
    axios
      .post(url, params)
      .then(() => {
        console.log("Multipart upload aborted successfully.");
      })
      .catch((err) => {
        console.error("Failed to abort multipart upload:", err.message);
      });
  };

  return { bigProgress, getSignedURLS };
};

export default useUploadHeavyFile;
