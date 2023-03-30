/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect } from "react";
import { useContext, useState } from "react";
import UserContext from "../../containers/UserContext";
import {
  Button,
  Form,
  FormControl,
  InputGroup,
  Modal,
  Row,
} from "react-bootstrap";

const ForkAndSnapshotModal = (props) => {
  const context = useContext(UserContext);
  const {
    showModal,
    setShowModal,
    taskCode,
    isFork,
    modalDescription,
    handleSave,
  } = props;

  const typeInLowerCase = isFork ? "fork" : "snapshot";

  const [name, setName] = useState("");
  const [formValidationMessage, setFormValidationMessage] = useState("");
  const [createdSuccessfully, setCreatedSuccessfully] = useState(null);
  const [copySuccess, setCopySuccess] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setName("");
    setFormValidationMessage("");
    setCreatedSuccessfully(null);
    setCopySuccess("");
    setUrl("");
    setDescription("");
  }, [showModal]);

  const handleSaveButtonClick = () => {
    const trimmedName = name.trim();

    if (isFork && trimmedName.length === 0) {
      setFormValidationMessage("Fork name cannot be empty.");
      return;
    }

    // We do this to avoid collision between existing page - tasks/<task_code>/create, tasks/<task_code>/verify, etc
    if (["create", "validate", "models", "round"].indexOf(trimmedName) !== -1) {
      setFormValidationMessage(
        "You cannot use this name. Please try a different one."
      );
      return;
    }

    const uriEncodedName = encodeURIComponent(trimmedName);
    const promise = handleSave(uriEncodedName, description, context.api);

    promise.then(
      (result) => {
        const url = `https://ldbd.ly/${taskCode}/${result.name}`;
        setName("");
        setCreatedSuccessfully(true);
        setUrl(url);
      },
      (error) => {
        console.log(error);
        if (error && error.status_code === 409) {
          setFormValidationMessage(
            `A fork or snapshot with the same name already exists.`
          );
        } else if (error && error.status_code === 403) {
          props.history.push(
            "/login?msg=" +
              encodeURIComponent(
                `You need to login to create a leaderboard ${typeInLowerCase}.`
              ) +
              `&src=/tasks/${taskCode}`
          );
        } else {
          setCreatedSuccessfully(false);
        }
      }
    );
  };

  const copyToClipboard = () => {
    const from = document.getElementById("forkOrSnapshotLink");
    const range = document.createRange();
    window.getSelection().removeAllRanges();
    range.selectNode(from);
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
    setCopySuccess("Copied successfully!");
  };

  return (
    <Modal show={showModal} onHide={() => setShowModal(false)} centered={true}>
      <Modal.Header closeButton>
        <Modal.Title className="text-normal-case">
          {typeInLowerCase}
        </Modal.Title>
      </Modal.Header>
      {createdSuccessfully === null ? (
        <Modal.Body>
          <p>{modalDescription}</p>
          <p className="mt-4">
            {`Choose a name for your ${typeInLowerCase}. The name will be URI encoded upon saving.`}
          </p>
          <InputGroup hasValidation>
            <FormControl
              className="mx-3 p-3 rounded-1 thick-border h-auto"
              placeholder={"Enter a name.."}
              value={name}
              onChange={(e) => {
                const updatedName = e.target.value;
                setName(updatedName);
                if (updatedName.length !== 0) {
                  setFormValidationMessage("");
                }
              }}
              required={isFork}
              isInvalid={formValidationMessage.length !== 0}
            />
            <Form.Control.Feedback className="px-3" type="invalid">
              {formValidationMessage}
            </Form.Control.Feedback>
          </InputGroup>
          <p className="mt-4">{`Enter a description for your ${typeInLowerCase}:`}</p>
          <InputGroup>
            <FormControl
              className="mx-3 p-3 rounded-1 thick-border h-auto"
              placeholder={""}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              as="textarea"
            />
          </InputGroup>
        </Modal.Body>
      ) : (
        <Modal.Body>
          {createdSuccessfully ? (
            <div>
              <p>{`Your ${typeInLowerCase} is ready. The permanent link to your ${typeInLowerCase} is:`}</p>
              <p className="text-break" id="forkOrSnapshotLink">
                {url}
              </p>
              <div className="d-flex text-center flex-column align-items-center">
                <Row className="justify-content-between">
                  <Button
                    className="mx-1"
                    variant="primary"
                    onClick={copyToClipboard}
                  >
                    Copy
                  </Button>
                  <Button
                    className="mx-1"
                    variant="primary"
                    onClick={() => window.open(url, "_blank")}
                  >
                    Go to URL
                  </Button>
                </Row>
                <p className="my-0">{copySuccess}</p>
              </div>
            </div>
          ) : (
            <p>
              {`There was an error in creating your ${typeInLowerCase}. Please contact support or try again later.`}
            </p>
          )}
        </Modal.Body>
      )}
      <Modal.Footer className={isFork ? "" : "d-flex justify-content-center"}>
        {createdSuccessfully === null && (
          <Button
            disabled={formValidationMessage.length !== 0}
            variant="primary"
            onClick={handleSaveButtonClick}
          >
            {isFork ? "Save" : "Generate"}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ForkAndSnapshotModal;
