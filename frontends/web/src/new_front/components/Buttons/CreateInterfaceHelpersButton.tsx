import React, { FC, useState, useContext, useEffect } from "react";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { Modal } from "react-bootstrap";
import MDEditor from "@uiw/react-md-editor";
import ShowInstructionsButton from "new_front/components/Buttons/ShowInstructionsButton";
import { useTranslation } from "react-i18next";
import "./light-mode-override.css";

type CreateInterfaceHelpersButtonProps = {
  generalInstructions: string;
  creationExample?: string;
  realRoundId: number;
  userId: number;
};

const CreateInterfaceHelpersButton: FC<CreateInterfaceHelpersButtonProps> = ({
  generalInstructions,
  creationExample,
  realRoundId,
  userId,
}) => {
  const { amountExamplesCreatedToday, updateAmountExamplesCreatedToday } =
    useContext(CreateInterfaceContext);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showCreationExample, setShowCreationExample] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    updateAmountExamplesCreatedToday(realRoundId, userId);
  }, [realRoundId, userId]);

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="col-span-2 ">
        {amountExamplesCreatedToday !== null ? (
          <div className="text-xs text-gray-500">
            {amountExamplesCreatedToday} {t("interface:examples_created")}
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
                <Modal.Header closeButton className="px-4">
                  <Modal.Title>Example</Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4">
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
