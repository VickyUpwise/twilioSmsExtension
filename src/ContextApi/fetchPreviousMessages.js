import React, { createContext, useContext, useState, useRef } from "react";
import { fetchPreviousMessages } from "./twilioApis"; // already modularized
import { useTwilioConfig } from "./twilioConfigContext";

const ConversationContext = createContext();

export function ConversationProvider({ children }) {
    const { twilioConfig, dispatchTwilioConfig } = useTwilioConfig();
    
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshFeed, setRefreshFeed] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [messageSent, setMessageSent] = useState(false);
  const chatContainerRef = useRef(null);
  const sidAtMessageSend = useRef(null);
  const nextPageTokenRef = useRef(null);

  const fetchPreviousMessagesFromTwilio = async (initialFetch = false, ) => {
    if (!twilioConfig.currentConversationSid && !sidAtMessageSend.current) {
      console.error("Conversation SID is missing. Cannot fetch messages.");
      return;
    }

    if ((loadingMessages && !initialFetch) || (!initialFetch && nextPageTokenRef.current === null)) {
      console.log("return previous fetch", {loadingMessages: loadingMessages}, {nextpage :nextPageTokenRef.current === null}, {initialFetch:initialFetch})
      return;
    }

    try {
      setLoadingMessages(true);

      const previousScrollHeight = chatContainerRef.current?.scrollHeight || 0;
      const conversationSid = sidAtMessageSend.current || twilioConfig.currentConversationSid ;
      // console.log("sid",sidAtMessageSend.current, twilioConfig.currentConversationSid)
      // console.log('conversation sid in use', conversationSid)
      const pageToken = initialFetch ? null : nextPageTokenRef.current;

      const { success, history, nextPageToken } = await fetchPreviousMessages(
        twilioConfig.userID,
        conversationSid,
        pageToken
      );

      let updatedMessages = success ? history : [];

      updatedMessages.sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));
      setMessages((prev) => (initialFetch ? updatedMessages : [...updatedMessages, ...prev]));

      nextPageTokenRef.current = nextPageToken;

      if (chatContainerRef.current) {
        setTimeout(() => {
          chatContainerRef.current.scrollTop = initialFetch
            ? chatContainerRef.current.scrollHeight
            : chatContainerRef.current.scrollHeight - previousScrollHeight;
        }, 100);
      }
    } catch (e) {
      const {succss, message, error} = e
      console.error("Error fetching messages:", e);
      if ((error.message).includes(`The requested resource /Conversations/${twilioConfig.currentConversationSid}/Messages was not found`)) {
    const response = await ZOHO.CRM.API.deleteRecord({
      Entity: "testankitext__Conversation_Sid",
      RecordID: twilioConfig.customModuleRecordId
    });

    dispatchTwilioConfig({
      type: 'SET_CONFIG',
      payload: {
        currentConversationSid: ''
      }
    });
  }
    } finally {
      setLoadingMessages(false);
      setRefreshFeed(false);
    }
  };

  return (
    <ConversationContext.Provider
      value={{
        messages,
        setMessages,
        loadingMessages,
        setLoadingMessages,
        refreshFeed,
        setRefreshFeed,
        chatContainerRef,
        sidAtMessageSend,
        nextPageTokenRef,
        renderCount,
        setRenderCount,
        messageSent, 
        setMessageSent,
        fetchPreviousMessagesFromTwilio
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export const useConversationContext = () => useContext(ConversationContext);
