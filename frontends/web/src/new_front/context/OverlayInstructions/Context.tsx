import React from "react";
export const OverlayInstructionsContext = React.createContext({
  hidden: true,
  setHidden: (state: boolean) => {},
});
