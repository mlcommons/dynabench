import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const useUploadFile = () => {
  const [progress, setProgress] = useState(0);

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
      })
      .then(() => {
        setProgress(1);
        return true;
      })
      .catch(() => {
        setProgress(0);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
        });
      });
  };

  return { progress, sendModelData };
};

export default useUploadFile;
