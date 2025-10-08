// AppProviders.js
import React from "react";
import { TwilioConfigProvider } from "../ContextApi/twilioConfigContext";
import { ConversationProvider } from "../ContextApi/fetchPreviousMessages";

const AppProviders = ({ children }) => (
  <TwilioConfigProvider>
    <ConversationProvider>
      {children}
    </ConversationProvider>
  </TwilioConfigProvider>
);

export default AppProviders;
