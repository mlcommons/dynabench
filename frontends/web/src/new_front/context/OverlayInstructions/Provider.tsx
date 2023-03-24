import React, { FC } from "react";
import { Modal } from "react-bootstrap";
import { OverlayInstructionsContext } from "./Context";

const OverlayInstructionsProvider: FC = ({ children }) => {
  const [hidden, setHidden] = React.useState(true);
  return (
    <>
      <Modal
        show={!hidden}
        onHide={() => setHidden(true)}
        dialogAs={() => null}
      ></Modal>
      <OverlayInstructionsContext.Provider value={{ hidden, setHidden }}>
        {children}
      </OverlayInstructionsContext.Provider>
    </>
  );
};

export default OverlayInstructionsProvider;
