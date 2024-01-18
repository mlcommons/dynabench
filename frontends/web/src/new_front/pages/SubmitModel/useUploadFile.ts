import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const useUploadFile = () => {
  const [progress, setProgress] = useState(0);

  const sendModelData = (formData: FormData) => {
    return axios
      .request({
        method: "post",
        url: `${process.env.REACT_APP_API_HOST_2}/model/upload_model_to_s3_and_evaluate`,
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
