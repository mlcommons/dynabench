import React, { FC, useState, createContext } from "react";
import { Modal } from "react-bootstrap";

export const OverlayInstructionsContext = createContext({
  hidden: true,
  setHidden: (state: boolean) => {},
});

type OverlayInstructionsProviderProps = {
  children: React.ReactNode;
};

const OverlayInstructionsProvider: FC<OverlayInstructionsProviderProps> = ({
  children,
}) => {
  const [hidden, setHidden] = useState(true);
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
