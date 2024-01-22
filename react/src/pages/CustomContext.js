import React from "react";

export const CustomContext = React.createContext(null);

export const CustomContextProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [approvedSpeakerRequestList, setApprovedSpeakerRequestList] = React.useState([]);
  const [presenters, setPresenters] = React.useState([]);
  const [presenterButtonDisabled, setPresenterButtonDisabled] = React.useState(false);

  return (
    <CustomContext.Provider
      value={{
        isAdmin,
        setIsAdmin,
        approvedSpeakerRequestList,
        setApprovedSpeakerRequestList,
        presenters,
        setPresenters,
        presenterButtonDisabled,
        setPresenterButtonDisabled
    }}>
      {children}
    </CustomContext.Provider>
  );
}
