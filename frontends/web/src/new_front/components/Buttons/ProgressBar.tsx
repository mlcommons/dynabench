import React from "react";

const ProgressBar = ({
  progress,
  text,
}: {
  progress: number;
  text: string;
}) => {
  return (
    <div
      className="center-loading"
      style={{
        width: "50%",
      }}
    >
      <h3> Please do not close this window</h3>
      <p>
        The upload depends on the size of the model and your internet
        connection, please be patient 😊
      </p>
      <div className="progress">
        <div
          className="progress-bar progress-bar-striped progress-bar-animated"
          role="progressbar"
          style={{ width: `${progress * 100}%` }}
        ></div>
      </div>
      <h6>
        {progress > 0 && progress < 0.5
          ? text
          : progress >= 0.5
          ? "We are processing your model"
          : ""}
      </h6>
    </div>
  );
};

export default ProgressBar;
