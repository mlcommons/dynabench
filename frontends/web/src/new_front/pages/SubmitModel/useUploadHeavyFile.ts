import { useState } from "react";
import axios from "axios";

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
        return false;
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
    const BATCH_SIZE = 100;
    const abortParams = {
      upload_id: uploadId,
      model_name: formData.get("model_name"),
      file_name: formData.get("file_name"),
      user_id: formData.get("user_id"),
      task_code: formData.get("task_code"),
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
        return completeUpload(formData, uploadId, localParts, abortParams).then(
          () => true,
        );
      }

      const batch = urls.slice(batchIndex, batchIndex + BATCH_SIZE);
      const promises = [];

      for (let i = 0; i < batch.length; i++) {
        const globalIndex = batchIndex + i;
        const start = globalIndex * chunkSize;
        const chunk = file?.slice(start, start + chunkSize);
        const promise = axios
          .request({
            method: "put",
            url: urls[globalIndex],
            data: chunk,
            headers: {
              "Content-Type": file.type,
            },
          })
          .then((response) => {
            localParts.push({
              ETag: response.headers.etag,
              PartNumber: globalIndex + 1,
            });
            setProgress((prevState) => prevState + uploadProgresschunk);
            return false;
          })
          .catch((err) => {
            console.error(`Failed to upload part ${i + 1}: ${err.message}`);
            uploadFailed = true;
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
