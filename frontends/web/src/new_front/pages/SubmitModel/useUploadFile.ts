import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const useUploadFile = () => {
  const [progress, setProgress] = useState(0);
  const token = localStorage.getItem("id_token") || "";
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

  const sendModelData = (formData: FormData, heavy: boolean = false) => {
    const url = `${process.env.REACT_APP_API_HOST_2}${
      heavy
        ? "/model/heavy_evaluation"
        : "/model/upload_model_to_s3_and_evaluate"
    }`;
    return axios
      .request({
        method: "post",
        url: url,
        data: formData,
        onUploadProgress: (p) => {
          setProgress(p.loaded / p.total);
        },
        withCredentials: true,
      })
      .then((response) => {
        setProgress(1);
        if (response.status >= 200 && response.status < 300) {
          return {
            success: true,
            data: response.data,
            message: "Upload successful",
          };
        } else {
          throw new Error(`Unexpected response status: ${response.status}`);
        }
      })
      .catch((error) => {
        setProgress(0);

        let errorMessage = "Something went wrong!";
        let errorTitle = "Upload Failed";
        let onCloseAction = false;

        if (error.response) {
          const status = error.response.status;
          const data = error.response.data;

          switch (status) {
            case 401:
              errorTitle = "Authentication Required";
              errorMessage = "Please log in again to continue.";
              onCloseAction = true;
              break;
            case 500:
              errorTitle = "Server Error";
              errorMessage =
                data.message || "Your model could not be processed.";
              break;
            default:
              errorMessage =
                data.message || `Server error (${status}). Please try again.`;
          }
        } else if (error.request) {
          errorTitle = "Connection Error";
          errorMessage =
            "Unable to connect to the server. Please check your internet connection and try again.";
        } else if (error.code === "ECONNABORTED") {
          errorTitle = "Upload Timeout";
          errorMessage =
            "The upload is taking too long. Please try again with a smaller file.";
        } else {
          errorTitle = "Unexpected Error";
          errorMessage =
            error.message || "An unexpected error occurred. Please try again.";
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

        return { success: false, error: error, message: errorMessage };
      });
  };

  const sendHFmodel = (formData: FormData) => {
    const url = `${process.env.REACT_APP_API_HOST_2}/model/upload_hf_model`;
    return axios
      .request({
        method: "post",
        url: url,
        data: formData,
        onUploadProgress: (p) => {
          setProgress(p.loaded / p.total);
        },
        withCredentials: true,
      })
      .then((response) => {
        setProgress(1);
        if (response.status >= 200 && response.status < 300) {
          return {
            success: true,
            data: response.data,
            message: "Upload successful",
          };
        } else {
          throw new Error(`Unexpected response status: ${response.status}`);
        }
      })
      .catch((error) => {
        setProgress(0);
        Swal.fire({
          icon: "error",
          title: "Upload Failed",
          text: "Something went wrong! Please try again.",
        });
        return {
          success: false,
          error: error,
          message: "Something went wrong!",
        };
      });
  };

  return { progress, sendModelData, sendHFmodel };
};

export default useUploadFile;
