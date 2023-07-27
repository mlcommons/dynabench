import React, { useState } from "react";
import SignContract from "new_front/components/Modals/SignContract";
import Modal from "react-bootstrap/Modal";

const Test = () => {
  const [show, setShow] = useState(true);
  const handleClose = () => setShow(false);

  return (
    <div>
      <button
        onClick={() => {
          setShow(true);
        }}
      >
        Open
      </button>
      <Modal show={show} onHide={handleClose} size="lg">
        <SignContract
          contract="lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
        vitae elit libero, a pharetra augue. Praesent commodo cursus magna,
        vel scelerisque nisl consectetur et. Cras mattis consectetur purus sit
        amet fermentum. Duis mollis, est non commodo luctus, nisi erat porttitor
        ligula, eget lacinia odio sem nec elit. Nullam quis risus eget urna mollis
        lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
        vitae elit libero, a pharetra augue. Praesent commodo cursus magna,
        vel scelerisque nisl consectetur et. Cras mattis consectetur purus sit
        amet fermentum. Duis mollis, est non commodo luctus, nisi erat porttitor
        ligula, eget lacinia odio sem nec elit. Nullam quis risus eget urna mollis
        lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
        vitae elit libero, a pharetra augue. Praesent commodo cursus magna,
        vel scelerisque nisl consectetur et. Cras mattis consectetur purus sit
        amet fermentum. Duis mollis, est non commodo luctus, nisi erat porttitor
        ligula, eget lacinia odio sem nec elit. Nullam quis risus eget urna mollis

        "
          handleClose={handleClose}
        />
      </Modal>
    </div>
  );
};

export default Test;
