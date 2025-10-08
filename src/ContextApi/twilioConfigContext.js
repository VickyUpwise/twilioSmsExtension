import React, { createContext, useReducer, useContext } from "react";
import {
  twilioConfigReducer,
  initialTwilioConfig,
} from "./twilioConfigReducer";

const TwilioConfigContext = createContext();

export const TwilioConfigProvider = ({ children }) => {
  const [twilioConfig, dispatchTwilioConfig] = useReducer(
    twilioConfigReducer,
    initialTwilioConfig
  );

  return (
    <TwilioConfigContext.Provider
      value={{ twilioConfig, dispatchTwilioConfig }}
    >
      {children}
    </TwilioConfigContext.Provider>
  );
};

export const useTwilioConfig = () => useContext(TwilioConfigContext);
