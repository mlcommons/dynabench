import React from "react";
import AnnotationTitle from "../../components/CreateSamples/AnnotationTitle";

const CreateInterface = () => {
  return (
    <>
      <div className="container">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            {/* <AnnotationTitle
              taskName='Hate speech'
              selectedModel

            /> */}
          </div>
          <div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm btn-help-info"
              >
                <i className="fas fa-question"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateInterface;
