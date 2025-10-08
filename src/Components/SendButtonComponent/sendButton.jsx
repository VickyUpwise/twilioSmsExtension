import { useState, useRef } from "react";
import { useTwilioConfig } from "../../ContextApi/twilioConfigContext";
import { createConversation, deleteConversation } from "../../ContextApi/twilioApis";
import { useConversationContext } from "../../ContextApi/fetchPreviousMessages";
import { sendMessage } from "../../ContextApi/twilioApis";
import './sendButton.scss'
import { toast } from "react-toastify";

const SendButton = ({closeSections}) => {

    const [buttonState, setButtonState] = useState("idle");
    const { twilioConfig, dispatchTwilioConfig } = useTwilioConfig();
    const twilioConfigRef = useRef(twilioConfig)
    const { messages,
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
        fetchPreviousMessagesFromTwilio,
        messageSent, 
        setMessageSent
      } = useConversationContext();

    const handleSendMessageClick = async () => {
        if (!twilioConfig.attachment.length && !twilioConfig.newMessage.trim()) {
          setButtonState("idle");
          return;
        }
    
        if(twilioConfigRef.current.currentDefaultRecipientNumber === "Number Needed" || !twilioConfigRef.current.currentTwilioNumber){
          toast.warn(`${twilioConfigRef.current.currentDefaultRecipientNumber === "Number Needed" ? "Receivers" : !twilioConfigRef.current.currentTwilioNumber ? "Senders" : ''} number needed.`);
          return;
        }
        
        handleSendMessage();
    };

    const handleSendMessage = async () => {
      setButtonState("loading");
    
      try {
        let messageSentStatus;
        let messageSid;
        if (twilioConfig.currentConversationSid) {
            const {success, mediaSids, textMessageSid, conversationSidInMessage} = await sendMessage(twilioConfig.userID, twilioConfig.currentConversationSid,  twilioConfig.newMessage, twilioConfig.attachment);
            messageSentStatus = success;
            messageSid = textMessageSid || '';
            console.log('conversation sid at message sent', conversationSidInMessage)
            sidAtMessageSend.current = conversationSidInMessage;
          }
        else{
            const {conversationSid, reused, conversationSuccess} = await createConversation(twilioConfig.userID, twilioConfig.currentTwilioNumber, twilioConfig.currentDefaultRecipientNumber)
            if(conversationSuccess){
              if (conversationSuccess && reused) {
                toast.info('Existing conversation found. Continuing the conversation.');
              }
              dispatchTwilioConfig({
                  type: 'SET_CONFIG',
                  payload: {
                      currentConversationSid: conversationSid,
                  },
              })
              await storeConversationSidInCustomModule(conversationSid);
              const {success, mediaSids, textMessageSid, conversationSidInMessage} = await sendMessage( twilioConfig.userID,conversationSid, twilioConfig.newMessage, twilioConfig.attachment);
              messageSentStatus = success;
              messageSid = textMessageSid || '';
              sidAtMessageSend.current = conversationSidInMessage;
            }
        }

    
        if (messageSentStatus) {
          setMessageSent(true);
          setRenderCount(1)
          closeSections();
          dispatchTwilioConfig({
            type:"SET_CONFIG",
            payload:{
              newMessage: '',
              attachment: []
            }
          })
          fetchPreviousMessagesFromTwilio(true, twilioConfig.currentConversationSid);
        }
    
        // ✅ Scroll to latest message
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 200);
    
        setButtonState(messageSentStatus ? "success" : "error");
      }
      catch(e){
        const { success = false, message, error } = e;
        console.log('error in sending message', e)
        setButtonState("error");
      }
      finally{
        setTimeout(() => setButtonState("idle"), 5000);
      }  
    };

    // const handleContinueConversation = async (existingConversation) => {
    //   try{
    //   dispatchTwilioConfig({
    //                     type: 'SET_CONFIG',
    //                     payload: {
    //                       newMessage:'',
    //                       attachment:[],
    //                       currentConversationSid: existingConversation,
    //                       showExistedConversationWarning: false,
    //                     },
    //                 })
    //   await storeConversationSidInCustomModule(existingConversation)
    //   await fetchPreviousMessagesFromTwilio(true)
    //   setButtonState('idle')
    //   }
    //   catch(e){
    //     console.log('error in continue conversation', e)
    //   }
    // }

    // const handleDeleteConversation = async (sid) => {
    //   try{
    //     dispatchTwilioConfig({
    //         type: 'SET_CONFIG',
    //         payload: {
    //           newMessage:'',
    //           attachment:[],
    //           currentConversationSid: '',
    //           showExistedConversationWarning: false,
    //         },
    //     })
    //     const response = await deleteConversation(twilioConfig.userID, sid);
    
    //   }
    //   catch(e){
    //     const {success, message, error} = e;
    //     console.log('error in deleting conversation', error , message)
    //   }
    // }

    const storeConversationSidInCustomModule = async (conversationSid) => {
      try{
        const recordData = {
          Name: twilioConfig.currentDefaultRecipientNumber,
          testankitext__Conversation_Sid: conversationSid,
          testankitext__From: twilioConfig.currentTwilioNumber,
        };
      
        const insertResp = await ZOHO.CRM.API.insertRecord({
          Entity: "testankitext__Conversation_Sid",
          APIData: recordData,
          Trigger: ["workflow"]
        });
      }
      catch(error){
        console.error("Error storing sid in custom module", error)
      }
    }

    return (
      <>
        <button
            className={`button ${
              buttonState === "loading" ? "animate" : ""
            } ${buttonState === "success" ? "animate success" : ""} ${buttonState === "error" ? "animate error" : ""}`}
            onClick={handleSendMessageClick}
            disabled={buttonState === "loading"}
          >
                <svg width="22" height="22" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={`send-icon ${["loading", "success", "error"].includes(buttonState) ? "hidden" : ""}`}>
            <path d="M13.4644 0.387631L5.19459 1.84895C-0.363079 2.82703 -0.791611 5.72417 4.24492 8.2693L5.76795 9.04027C6.21084 9.26886 6.51941 9.68457 6.61 10.1747L6.90181 11.8486C7.8799 17.4063 10.77 17.8401 13.3222 12.7983L17.115 5.30568C18.8164 1.9445 17.1742 -0.267912 13.4644 0.387631ZM13.4061 5.06442L9.60132 7.88868C9.31243 8.10311 8.89505 8.04137 8.68061 7.75249C8.46618 7.46361 8.52792 7.04622 8.8168 6.83179L12.6216 4.00753C12.9105 3.7931 13.3279 3.85484 13.5423 4.14372C13.7567 4.4326 13.695 4.84999 13.4061 5.06442Z" fill="white"/>
            </svg>
          </button>

          {/* {
            twilioConfig.showExistedConversationWarning && (
              <div className="conversationExistedWarningContainer">
                        <div className="warningContent">
                        <span>Conversation between {twilioConfig.currentDefaultRecipientNumber} and {twilioConfig.currentTwilioNumber} already exists.</span>
                        <span>You can either continue the previous conversation or delete it.</span>
                        </div>
                        <div className="warningButtons">
                        <button onClick={() => handleContinueConversation(twilioConfig.existingConversationSid)}>Continue</button>
                        <button onClick={() => handleDeleteConversation(twilioConfig.existingConversationSid)}>Delete</button>
                        </div>
                    </div>
            )
          } */}
          </>
    );
};

export default SendButton;