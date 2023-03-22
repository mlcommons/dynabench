import React from "react";
import { Button } from "react-bootstrap";

const ValidationButtonActions = () => {
  const onSubmission = async () => {
    console.log("submit");
  };

  return (
    <>
      <div className="col-span-1 py-4">
        <div className="grid grid-cols-6">
          <div className="flex justify-start col-span-3 ">
            <div className="col-span-1 pl-2 " id="submit">
              <Button
                className="border-0 font-weight-bold light-gray-bg task-action-btn"
                onClick={onSubmission}
              >
                Submit
              </Button>
            </div>
            <div className="col-span-1 pl-2" id="switchContext">
              <Button
                className="border-0 font-weight-bold light-gray-bg task-action-btn"
                onClick={() => {
                  window.location.reload();
                }}
              >
                Skip and load a new example
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ValidationButtonActions;
