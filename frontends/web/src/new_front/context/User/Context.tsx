import React, { createContext, useState, FC } from "react";

export const UserContext = createContext({
  user: {},
});

type UserProps = {
  children: React.ReactNode;
};

export const UserProvider: FC<UserProps> = ({ children }) => {
  const user = {};

  return (
    <UserContext.Provider
      value={{
        user,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
