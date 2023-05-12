import React, { FC, useState } from "react";
import { Modal } from "react-bootstrap";
import Markdown from "react-markdown";
import ShowInstructionsButton from "new_front/components/Buttons/ShowInstructionsButton";

type CreateInterfaceHelpersButtonProps = {
  generalInstructions: string;
  creationExample?: string;
  amountsExamplesCreatedToday?: number;
};

const CreateInterfaceHelpersButton: FC<CreateInterfaceHelpersButtonProps> = ({
  generalInstructions,
  creationExample,
  amountsExamplesCreatedToday,
}) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [showCreationExample, setShowCreationExample] = useState(false);

  return (
    <div>
      <ShowInstructionsButton />
      {generalInstructions && (
        <button
          type="button"
          className="btn btn-outline-primary btn-sm btn-help-info"
          onClick={() => {
            setShowInstructions(!showInstructions);
          }}
        >
          <i className="fa fa-info-circle"></i>
        </button>
      )}

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
      {creationExample && (
        <>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm btn-help-info"
            onClick={() => {
              setShowCreationExample(!showCreationExample);
            }}
          >
            <span className="text-xs">Example</span>
          </button>
          {showCreationExample && (
            <>
              <Modal
                show={showCreationExample}
                onHide={() => {
                  setShowCreationExample(false);
                }}
              >
                <Modal.Header closeButton>
                  <Modal.Title>Example</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Markdown>{creationExample}</Markdown>
                </Modal.Body>
              </Modal>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CreateInterfaceHelpersButton;
