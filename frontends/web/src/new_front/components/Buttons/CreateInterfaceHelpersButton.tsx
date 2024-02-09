import React, { FC, useState } from "react";
import { Modal } from "react-bootstrap";
import MDEditor from "@uiw/react-md-editor";
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
    <div className="flex items-center justify-between gap-2">
      <div className="col-span-2 ">
        {amountsExamplesCreatedToday !== null ? (
          <div className="text-xs text-gray-500">
            {amountsExamplesCreatedToday} examples created
          </div>
        ) : null}
      </div>
      <div className="hidden md:block">
        <ShowInstructionsButton />
      </div>

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
              <MDEditor.Markdown source={generalInstructions} />
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
                size="lg"
              >
                <Modal.Header closeButton>
                  <Modal.Title>Example</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <MDEditor.Markdown source={creationExample} />
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
