import React, { FC } from "react";
import Modal from "react-bootstrap/Modal";

import GeneralButton from "new_front/components/Buttons/GeneralButton";
import AnnotationUserInputStrategy from "new_front/components/CreateSamples/CreateSamples/AnnotationInterfaces/UserInput/AnnotationUserInputStrategy";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";

type PreliminaryQuestionsProps = {
  handleClose: () => void;
  config: AnnotationUserInput[];
  isGenerativeContext: boolean;
  title?: string;
};

const PreliminaryQuestions: FC<PreliminaryQuestionsProps> = ({
  handleClose,
  config,
  isGenerativeContext,
  title,
}) => {
  return (
    <div className="p-4 rounded-lg">
      <Modal.Header closeButton>
        <Modal.Title className="text-2xl font-bold text-letter-color">
          {title || "Information"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="px-4 mx-auto overflow-auto">
          <AnnotationUserInputStrategy
            config={config}
            isGenerativeContext={isGenerativeContext}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="my-3 form-check">
          <GeneralButton
            onClick={handleClose}
            text="Submit"
            className="px-4 py-1 font-semibold border-0 font-weight-bold light-gray-bg task-action-btn "
          />
        </div>
      </Modal.Footer>
    </div>
  );
};

export default PreliminaryQuestions;
