import React, { FC, useState } from "react";
import { Modal } from "react-bootstrap";
import Markdown from "react-markdown";

type CreateInterfaceHelpersButtonProps = {
  generalInstructions: string;
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
};

const CreateInterfaceHelpersButton: FC<CreateInterfaceHelpersButtonProps> = ({
  generalInstructions,
  hidden,
  setHidden,
}) => {
  const [showInstructions, setShowInstructions] = useState(false);
  return (
    <div>
      <button
        type="button"
        className="mr-1 btn btn-outline-primary btn-sm btn-help-info"
        onClick={() => {
          setHidden(!hidden);
        }}
      >
        <i className="fas fa-question"></i>
      </button>
      <button
        type="button"
        className="btn btn-outline-primary btn-sm btn-help-info"
        onClick={() => {
          setShowInstructions(!showInstructions);
        }}
      >
        <i className="fa fa-cog"></i>
      </button>
      {showInstructions && (
        <>
          <Modal
            show={showInstructions}
            onHide={() => {
              setShowInstructions(false);
            }}
          >
            <Modal.Header closeButton>
              <Modal.Title>Instructions</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Markdown>{generalInstructions}</Markdown>
            </Modal.Body>
          </Modal>
        </>
      )}
    </div>
  );
};

export default CreateInterfaceHelpersButton;
