import React, { FC, useState } from "react";
import { Modal } from "react-bootstrap";
import Markdown from "react-markdown";
import ShowInstructionsButton from "new_front/components/Buttons/ShowInstructionsButton";

type CreateInterfaceHelpersButtonProps = {
  generalInstructions: string;
};

const CreateInterfaceHelpersButton: FC<CreateInterfaceHelpersButtonProps> = ({
  generalInstructions,
}) => {
  const [showInstructions, setShowInstructions] = useState(false);
  return (
    <div>
      <ShowInstructionsButton />
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
