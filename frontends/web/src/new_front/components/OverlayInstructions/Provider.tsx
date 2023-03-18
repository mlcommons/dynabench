import React, { createContext, useContext, FC, useState } from "react";
import { Modal } from "react-bootstrap";

type ProviderProps = {
  children: React.ReactNode;
};

const OverlayContext = createContext({
  hidden: true,
  setHidden: (hidden: boolean) => {},
});

const OverlayProvider: FC<ProviderProps> = ({ children }) => {
  const [hidden, setHidden] = useState(true);
  return (
    <div>
      <Modal
        show={!hidden}
        onHide={() => setHidden(true)}
        dialogAs={() => null}
      ></Modal>
      <OverlayContext.Provider
        value={{
          hidden,
          setHidden,
        }}
      >
        {children}
      </OverlayContext.Provider>
    </div>
  );
};

const useOverlayContext = () => useContext(OverlayContext);

export { OverlayProvider, OverlayContext, useOverlayContext };
