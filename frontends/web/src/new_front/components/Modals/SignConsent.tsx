import React, { FC } from "react";
import Modal from "react-bootstrap/Modal";
import parse from "html-react-parser";

type SignConsentProps = {
  handleClose: () => void;
  consentTerms: string;
  agreeText: string | null;
};

const SignConsent: FC<SignConsentProps> = ({
  handleClose,
  consentTerms,
  agreeText,
}) => {
  return (
    <div className="p-4 rounded-lg">
      <Modal.Header closeButton>
        <Modal.Title className="text-2xl font-bold text-letter-color">
          Consent
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="px-4 mx-auto overflow-auto">
          <p
            className="text-letter-color mb-4"
            style={{ whiteSpace: "pre-line" }}
          >
            {parse(consentTerms)}
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="my-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            onClick={handleClose}
          />
          <label className="form-check-label text-letter-color">
            {agreeText}
          </label>
        </div>
      </Modal.Footer>
    </div>
  );
};

export default SignConsent;
