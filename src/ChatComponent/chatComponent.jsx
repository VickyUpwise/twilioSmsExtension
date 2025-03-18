import React, { useState, useEffect, useRef } from "react";
import { Box, Select, MenuItem, Tooltip } from "@mui/material";
import { FiAlertCircle } from "react-icons/fi";
import { IoIosSend, IoMdPerson } from "react-icons/io";
import { IoCheckmarkDoneOutline } from "react-icons/io5";
import { MdOutlineWatchLater, MdDone, MdQueryBuilder } from "react-icons/md";
import { IoCloseCircleOutline } from "react-icons/io5";
import { IoMailUnreadOutline } from "react-icons/io5";
import { toast, ToastContainer } from "react-toastify";
import { GrEmoji } from "react-icons/gr";
import { RxCross1 } from "react-icons/rx";
import { TbReload } from "react-icons/tb";
import { RiSlashCommands2 } from "react-icons/ri";
import { CgAttachment } from "react-icons/cg";
import emptyChatLog from "../utility/emptyChatLog.png";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import "./chatComponent.scss";
import "react-toastify/dist/ReactToastify.css";
import TemplateComponent from "../TemplateComponent/templateComponent";
import MediaComponent from "../MediaComponent/mediaComponent";
import eclipse from "../utility/reload.gif";
import Divider from "@mui/material/Divider";
import loaderGIF from "../utility/Loader.gif";
import { color } from "framer-motion";
import { RxQuestionMarkCircled } from "react-icons/rx";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button, Skeleton
} from "@mui/material";
import twilioErrors from '../errors.json';
import phoneImage from '../utility/Phone.png'
import confused from '../utility/confused.png'
import MediaPlaceholder from '../MediaPlaceholder/mediaPlaceholder'

const ChatComponent = () => {
  const [env, setEnv] = useState({
    entity: "",
    entityId: "",
    full_name: "",
    phone: "",
    mobile: "",
  });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [buttonState, setButtonState] = useState("idle");
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [twiliophone, setTwilioPhone] = useState("");
  const [twilioPhoneNumbers, setTwilioPhoneNumbers] = useState([]);
  const [showPopUp, setShowPopUp] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [defaultNumber, setDefaultNumber] = useState("");
  const chatContainerRef = useRef(null);
  const [messageSent, setMessageSent] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [showTemplateComponent, setShowTemplateComponent] = useState(false);
  const [templateCont, setTemplateCont] = useState("");
  const [attachment, setAttachment] = useState([]);
  const [attachmentSid, setAttachmentSid] = useState([]);
  const [mediaComponent, setMediaComponent] = useState(false);
  const [refreshFeed, setRefreshFeed] = useState(false);
  const textareaRef = useRef(null);
  const [loadingMessages, setLoadingMessages] = useState(false); // Prevent multiple fetch calls
  const nextPageTokenRef = useRef(null);
  const [phoneValid, setPhoneValid] = useState(null);
  const [mobileValid, setMobileValid] = useState(null);
  const [showNoNumberModal, setShowNoNumberModal] = useState(false);
  const MAX_TWILIO_CHAR_LIMIT = 1600; // Twilio's character limit for long messages
  const [loading, setLoading] = useState(true)
  const [accessToken, setAccessToken] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [conversationsid, setConversationsid] = useState({});
  const [currentConversationSid, setCurrentConversationSid] = useState('')
  const [conversationServiceSid, setConversationServiceSid] = useState("");
  const [media, setMedia] = useState([]);

  //fetch the entity data and Twilio Account Details on pageload
  useEffect(() => {
    ZOHO.embeddedApp.on("PageLoad", async function (data) {
      setEnv((prevEnv) => ({
        ...prevEnv,
        entity: data.Entity,
        entityId: data.EntityId,
      }));
      fetchAccountDetails();
    });
    ZOHO.embeddedApp.init().then(() => {});
  }, [env.entity, env.entityId]);

  // fetch client details when entity and entity id is available
  useEffect(() => {
    if (env.entity && env.entityId) {
      fetchClientDetails();
    }
  }, [env.entity, env.entityId, accountSid, authToken]);

  // fetch chat history
  useEffect(() => {
    if (twiliophone && defaultNumber) {
      setMessages([]);
      fetchPreviousMessagesFromTwilio(true);
    }
  }, [defaultNumber, twiliophone]);

  // looping to fetch messages after new message is sent
  useEffect(() => {
    let intervalId;
    let timeoutId;

    if (messageSent && renderCount === 0) {
        // 🔹 Add an initial delay before executing the function
        timeoutId = setTimeout(() => {
            fetchPreviousMessagesFromTwilio(true);
            setRenderCount(1);

            let currentCount = 1;
            let intervalTimes = [30000, 60000, 90000];

            const executeFetch = () => {
                if (currentCount >= intervalTimes.length) {
                    clearInterval(intervalId);
                    setMessageSent(false);
                } else {
                    fetchPreviousMessagesFromTwilio(true);
                    currentCount++;
                    setRenderCount(currentCount);
                    console.log('fetching history', currentCount);
                    intervalId = setTimeout(executeFetch, intervalTimes[currentCount]);
                }
            };

            intervalId = setTimeout(executeFetch, intervalTimes[currentCount - 1]);
        }, 5000); // 🔹 Initial delay before starting execution (5 seconds)

    }

    return () => {
        clearTimeout(timeoutId);  // Clear initial delay if component unmounts
        clearTimeout(intervalId); // Clear interval on unmount
    };
}, [messageSent, renderCount]); // 🔹 Dependency array to run when messageSent changes


  // Fix the scroll height of the chat container 
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch next message history when user scroll to top
  const handleScroll = () => {
    if (!chatContainerRef.current) return "retruning handlescroll";

    // If user has scrolled to the top, fetch more messages
    if (chatContainerRef.current.scrollTop === 0 && nextPageTokenRef.current !== null) {
      console.log("🔼 User scrolled to top, fetching previous messages...");
      fetchPreviousMessagesFromTwilio(false);
    }
  };

  // Attach the scroll event listener
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (chatContainer) {
        chatContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [currentConversationSid, messages]);

  // show warning message when character limmit reach
  useEffect(() => {
    if (accountSid) {
      if (newMessage.length > 1600) {
        setShowPopUp(true); // Explicitly show the popup
      } else setShowPopUp(false);
      if (!newMessage) {
        textareaRef.current.style.height = "30px"; // Reset height after sending message
      }
    }
  }, [newMessage]);

  // Function to check if the Twilio number is active
  const checkTwilioNumberStatus = async (number, sid, token) => {
    try {
      if (!number || !sid || !token) {
        return { status: false, error: "Missing number, SID, or Auth Token" };
      }

      const response = await axios.get(
        `https://lookups.twilio.com/v1/PhoneNumbers/${encodeURIComponent(
          number
        )}?Type=carrier`,
        {
          auth: { username: sid, password: token },
        }
      );

      // If carrier data exists, the number is active
      return { status: response.data.carrier ? true : false, error: null };
    } catch (error) {
      console.error("Error checking Twilio number status:", error);

      if (error.response) {
        const errorCode = error.response.status;
        const errorMessage = error.response.data.message || "Unknown error";

        switch (errorCode) {
          case 21608:
            return {
              status: false,
              error: "Permission denied: SMS is not enabled for this region",
            };
          case 21606:
            return {
              status: false,
              error:
                "Invalid 'From' number: Not a valid SMS-capable Twilio number",
            };
          case 20003:
            return {
              status: false,
              error:
                "Authentication Error: Twilio credentials may be incorrect or the account is suspended",
            };
          case 30007:
            return {
              status: false,
              error: "Message blocked: Carrier filtering in place",
            };
          case 30005:
            return {
              status: false,
              error: "Invalid or released Twilio number: No longer exists",
            };
          default:
            return {
              status: false,
              error: `Twilio API error: ${errorMessage}`,
            };
        }
      }

      return { status: false, error: "Network error or unknown Twilio issue" };
    }
  };

  const twilioWebHookNotify = async () => {
    var req_data = {};
    const response = await ZOHO.CRM.FUNCTIONS.execute("twiliophonenumbervalidatorbyupro__twilionotification", req_data)
    console.log("response", response)
  }

  // Fetch Twilio credentials and check if number is active
  const fetchAccountDetails = async () => {
    try {
      setLoading(true)
      const twilioSID = await ZOHO.CRM.API.getOrgVariable(
        "twiliophonenumbervalidatorbyupro__Twilio_SID"
      );
      const twilioToken = await ZOHO.CRM.API.getOrgVariable(
        "twiliophonenumbervalidatorbyupro__Twilio_Token"
      );
      const currentTwilioNumber = await ZOHO.CRM.API.getOrgVariable(
        "twiliophonenumbervalidatorbyupro__Current_Twilio_Number"
      );
      const twilioPhoneNumbers = await ZOHO.CRM.API.getOrgVariable(
        "twiliophonenumbervalidatorbyupro__Phone_Numbers"
      );
      const twilioApiKey = await ZOHO.CRM.API.getOrgVariable(
        "twiliophonenumbervalidatorbyupro__Twilio_Api_Key"
      )
      const twilioSecret = await ZOHO.CRM.API.getOrgVariable(
        "twiliophonenumbervalidatorbyupro__Twilio_Api_Secret"
      )
      const conversationServiceSid = await ZOHO.CRM.API.getOrgVariable(
        'twiliophonenumbervalidatorbyupro__Conversation_Service_SID'
      )
      
      const sidContent = twilioSID.Success.Content;
      const tokenContent = twilioToken.Success.Content;
      const numberContent = currentTwilioNumber.Success.Content;
      const numberList = JSON.parse(twilioPhoneNumbers.Success.Content);
      const key = twilioApiKey.Success.Content;
      const secret = twilioSecret.Success.Content;
      const cSSid = conversationServiceSid.Success.Content;
      

      setAccountSid(sidContent || "");
      setAuthToken(tokenContent || "");
      setTwilioPhone(numberContent || "");
      setTwilioPhoneNumbers(numberList || []);
      setApiKey(key || "");
      setApiSecret(secret || "");
      setConversationServiceSid(cSSid || "");
     
      if (!numberContent) {
        setShowNoNumberModal(true); // Show modal when no number is selected
      }

      // Validate Twilio number status
      if (numberContent) {
        const { status, error } = await checkTwilioNumberStatus(
          numberContent,
          sidContent,
          tokenContent
        ); // Extract `status` and `error`

        if (!status) {
          toast.error(`${error}`);
          setTwilioPhone(""); // Reset inactive number
        }
      }
    } catch (error) {
      console.error("Error getting Account Details", error);
      toast.error(" Failed to fetch Twilio credentials.");
    }
    finally{
      setLoading(false)
    }
  };

  //Fetching the Record of Individual from ZOHO
  const fetchClientDetails = async () => {
    try {
      const recordData = await ZOHO.CRM.API.getRecord({
        Entity: env.entity,
        RecordID: env.entityId,
      });

      const entityData = recordData.data[0];

      let phone = entityData.Phone || "Number Needed";
      let mobile = entityData.Mobile || "Number Needed"; // Set "Number Needed" if mobile is null
      
      let sid = entityData.twiliophonenumbervalidatorbyupro__Chat_SID || JSON.stringify({"Mobile":[{"Number":"", "sid":""}], "Phone": [{"Number":"", "sid":""}]})
      console.log("SID from Zoho:", sid);
      
      let chatSid;
        try {
            chatSid = typeof sid === "string" ? JSON.parse(sid) : sid;
        } catch (error) {
            console.error("❌ Error parsing Chat_SID:", error, "Raw Data:", sid);
            chatSid = { "Mobile": [], "Phone": [] }; // Fallback to valid JSON
        }


        let storedMobileEntry = chatSid?.Mobile?.find(entry => entry.Number === mobile) || null;
      console.log("Data from Zoho:", chatSid);
console.log("Stored Mobile Entry:", storedMobileEntry);
console.log("Extracted SID:", storedMobileEntry ? storedMobileEntry.sid : "NOT FOUND");
      // Validate only if the number exists
      const isPhoneValid = phone !== "Number Needed" ? await validatePhoneNumber(phone) : false;
      const isMobileValid = mobile !== "Number Needed" ? await validatePhoneNumber(mobile) : false;
      // Set mobile as default number
      setEnv((prevEnv) => ({
        ...prevEnv,
        full_name: entityData.Full_Name,
        phone,
        mobile,
      }));
      setConversationsid(chatSid)
      setPhoneValid(isPhoneValid);
      setMobileValid(isMobileValid);
      setDefaultNumber(mobile); // Always set mobile as default
      setCurrentConversationSid(storedMobileEntry.sid || '')
    } catch (error) {
      console.log("Error fetching client details:", error);
    }
  };

  // Verifying Receiver numbers 
  const validatePhoneNumber = async (phoneNumber) => {
    if (!phoneNumber || !accountSid || !authToken) {
      return false};

    if (!phoneNumber.startsWith("+")) {
      toast.error( `${phoneNumber === env.mobile ? "Mobile": "Phone"} number must include a country code.`);
      return;

    }
    try {
      const response = await axios.get(
        `https://lookups.twilio.com/v1/PhoneNumbers/${encodeURIComponent(
          phoneNumber
        )}?Type=carrier`,
        {
          auth: {
            username: accountSid,
            password: authToken,
          },
        }
      );

      // Twilio returns valid phone numbers with carrier info.
      return response.data.carrier ? true : false;
    } catch (error) {
      console.error("Error validating phone number:", phoneNumber, error);
      return false; // Assume invalid for any other errors.
    }
  };

  const handleTwilioError = (error) => {
    if (!error.response) return "Network error. Please check your connection.";
  
    const errorCode = error.response.status;
    const errorMessage = error.response.data?.message || "Unknown Twilio error.";
  
    return twilioErrors[errorCode] || `Twilio API error: ${errorMessage}`;
  };

  // Function to split the message into chunks of MAX_TWILIO_CHAR_LIMIT characters
  const splitMessageIntoChunks = (message) => {
    const chunks = [];
    let start = 0;
  
    while (start < message.length) {
      chunks.push(message.substring(start, start + MAX_TWILIO_CHAR_LIMIT));
      start += MAX_TWILIO_CHAR_LIMIT;
    }
    
    return chunks;
  };

  // const sendMessage = async () => {
  //   const messageChunks = splitMessageIntoChunks(newMessage); // Split the message into chunks
  //   const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  //   const auth = {
  //     username: accountSid,
  //     password: authToken,
  //   };

  //   let lastResponseStatus = null;

  //   try {
  //     // Send each message chunk separately
  //     for (const chunk of messageChunks) {
  //       const data = new URLSearchParams({
  //         Body: chunk, // Message content
  //         From: twiliophone, // Your Twilio phone number
  //         To: defaultNumber, // Lead/Contact phone number
  //       });

  //       const response = await axios.post(url, data, {
  //         auth: auth,
  //         headers: {
  //           "Content-Type": "application/x-www-form-urlencoded",
  //         },
  //       });
  //       console.log("response", response);
  //       lastResponseStatus = response.status;

  //       if (response.status !== 201) {
  //         throw new Error(
  //           `Message segment failed to send with status ${response.status}`
  //         );
  //       }

  //       await new Promise((resolve) => setTimeout(resolve, 1500));
  //     }

  //     setNewMessage("");
  //     if (lastResponseStatus === 201) {
  //       setMessageSent(true);
  //       setRenderCount(0);
  //       setShowTemplateComponent(false);
  //     }
  //     fetchPreviousMessagesFromTwilio(true);
  //     return { status: lastResponseStatus };
  //   } catch (error) {
  //     console.error("Error sending message:", error);
  //     if (error.response?.data?.message === "Message body is required") {
  //       toast.error("Message cannot be empty.");
  //     } else if (error.response?.data?.message.includes("unverified")) {
  //       toast.error("The number is unverified. Please verify it in Twilio.");
  //     } else {
  //       toast.error("Message not sent. Please try again later.");
  //     }
  //     return { status: error.response?.status || null };
  //   }
  // };

  // const sendAttachment = async () => {
  //   const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  //   const auth = {
  //     username: accountSid,
  //     password: authToken,
  //   };

  //   const data = new URLSearchParams({
  //     MediaUrl: [attachmentUrl],
  //     From: twiliophone, // Your Twilio phone number
  //     To: defaultNumber, // Lead/Contact phone number
  //   });

  //   try {
  //     const response = await axios.post(url, data, {
  //       auth,
  //       headers: { "Content-Type": "application/x-www-form-urlencoded" },
  //     });

  //     if (response.status !== 201) {
  //       throw new Error(`Attachment failed with status ${response.status}`);
  //     }
  //     console.log("Media response", response);
  //     fetchPreviousMessagesFromTwilio(true);
  //     setAttachment("");
  //     setAttachmentUrl("");
  //     setShowTemplateComponent(false);

  //     return response.status;
  //   } catch (error) {
  //     console.log("error sending attachment", error);
  //   }
  // };

  const formatDate = (dateStr) => {
    // Parse the UTC date from the server
    const date = new Date(dateStr);

    dateStr;

    // Get the current date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight

    // Create a date object for yesterday
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Convert the message date to local time for comparison
    const localDate = new Date(date.toLocaleString());

    // Check if the message date matches today's or yesterday's date
    if (localDate.toDateString() === today.toDateString()) return `Today`;
    if (localDate.toDateString() === yesterday.toDateString())
      return `Yesterday`;

    // Format the date as '10-Oct-2024' if it's older
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return `${localDate
      .toLocaleDateString("en-GB", options)
      .replace(/ /g, "-")}`;
  };

  const formatMessage = (message) => {
    if(message == null) return;
    const formattedMessage = message
      .replace("Sent from your Twilio trial account - ", "") // format the message according to chatting application
      .replace(/\n/g, "<br />") // handle line breaks in the chats
      .replace(/(https?:\/\/[^\s]+)/g, (url) => {
        // Make URLs clickable
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      });

    return formattedMessage;
  };

  const getMessageStatusIcon = (delivery) => {

    if (!delivery) return null;
    if (delivery.failed === "all") {
      return <IoCloseCircleOutline title="failed" />;
    }
    if (delivery.undelivered === "all") {
      return <IoCloseCircleOutline title="Undelivered" />;
    }
    if (delivery.read === "all") {
      return <IoMailUnreadOutline title="Read" />;
    }
    if (delivery.delivered === "all") {
      return <IoCheckmarkDoneOutline title="Delivered" />;
    }
    if (delivery.sent === "all") {
      return <MdDone title="Sent" />;
    }
    if (delivery.queued === "all") {
      return <MdQueryBuilder title="Queued" />;
    }
    if (delivery.sending === "all") {
      return <MdOutlineWatchLater title="Sending" />;
    }
  
    return null; // Default case when no matching status is found
  };
  

  const handleDefaultNumberChange = (e) => {
    const newDefaultNumber = e.target.value;
    setDefaultNumber(newDefaultNumber);

    let storedEntry = null;

    if (conversationsid?.Phone && newDefaultNumber === env.phone) {
        storedEntry = conversationsid.Phone.find(entry => entry.Number === newDefaultNumber) || null;
    } else if (conversationsid?.Mobile) {
        storedEntry = conversationsid.Mobile.find(entry => entry.Number === newDefaultNumber) || null;
    }

    console.log("storedEntry:", storedEntry);

    if (!storedEntry) {
        console.warn("⚠️ No matching conversation SID found for:", newDefaultNumber);
    }

    setCurrentConversationSid(storedEntry ? storedEntry.sid : null);
};


  const handleSelectionChange = (e) => {
    try {
      const selectedValue = e.target.value;
      if (!selectedValue) {
        toast.error("Invalid selection. Please choose a valid number.");
      }
      setTwilioPhone(selectedValue);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;

    // Check for character limit and show warning
    if (value.length > MAX_TWILIO_CHAR_LIMIT) {
      setShowPopUp(true);
    } else {
      setShowPopUp(false);
    }

    setNewMessage(value);

    // Adjust textarea height dynamically
    textareaRef.current.style.height = "auto"; // Reset height
    if (value.trim() === "" || newMessage.length === 0) {
      textareaRef.current.style.height = "30px"; // Ensure it resets to min height
    } else {
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Expand based on content
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setNewMessage((prevMessage) => prevMessage + emojiObject.emoji);
  };

  const handleSendMessageClick = () => {
    // if (!attachmentSid && !newMessage.trim()) {
    //   toast.error("Message cannot be empty.");
    //   return;
    // }
    handleSendMessage();

  };

  // const handleSendMessage = async () => {
  //   setButtonState("loading");

  //   if (attachment && !attachmentUrl) {
  //     alert("Attachment is still uploading. Please wait.");
  //     setButtonState("idle");
  //     return;
  //   }

  //   try {
  //     let isSuccess = false;

  //     if (newMessage && !attachmentUrl) {
  //       // Case 1: Only message content
  //       const response = await sendMessage();
  //       isSuccess = response.status === 201;
  //     } else if (!newMessage && attachmentUrl) {
  //       // Case 2: Only attachment
  //       const response = await sendAttachment();
  //       isSuccess = response === 201;
  //     } else if (newMessage && attachmentUrl) {
  //       // Case 3: Both message and attachment
  //       const attachmentResponse = await sendAttachment();
  //       if (attachmentResponse === 201) {
  //         const messageResponse = await sendMessage();
  //         isSuccess = messageResponse.status === 201;
  //       }
  //     } else {
  //       // Default Case: No message or attachment
  //       toast.warn("Please provide a message or an attachment to send.");
  //       setButtonState("idle");
  //       return;
  //     }
  //     if (isSuccess) {
  //       setTimeout(() => {
  //         if (chatContainerRef.current) {
  //           chatContainerRef.current.scrollTop =
  //             chatContainerRef.current.scrollHeight;
  //         }
  //       }, 200); // Ensure chat stays at the bottom
  //     }
  //     setButtonState(isSuccess ? "success" : "error");
  //   } catch (error) {
  //     console.error("Error sending message or attachment:", error);
  //     setButtonState("error");
  //   }

  //   setTimeout(() => setButtonState("idle"), 5000); // Reset button state after 5 seconds
  // };

  const handleRefershFeed = () => {
    if ((!phoneValid && !mobileValid) || !twiliophone) {
      return;
    }
    setRefreshFeed(true);
    fetchPreviousMessagesFromTwilio(true);
  };

  const handleShowTemplate = () => {
    setShowTemplateComponent(!showTemplateComponent);
  };

  const handleTemplateContentChange = (content) => {
    setTemplateCont(content);
    setNewMessage(content);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"; // Reset height
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Expand based on content
      }
    }, 0);
  };

  const handleMediaComponent = () => {
    setMediaComponent(!mediaComponent);
  };

  const createConversation = async () => {
    try {
      var req_data ={
        "arguments": JSON.stringify({
            "defaultNumber" : defaultNumber,
            "twilioPhone" : twiliophone
        })
      };
      const response = await ZOHO.CRM.FUNCTIONS.execute("twiliophonenumbervalidatorbyupro__create_conversation", req_data)
      setCurrentConversationSid(response.details?.output);
      console.log("Conversation sid response", response)

      try{
        let newChatSid = { ...conversationsid };

        if (!newChatSid.Mobile) newChatSid.Mobile = [];
        if (!newChatSid.Phone) newChatSid.Phone = [];

      if (defaultNumber === env.mobile) {
        const existingMobile = newChatSid?.Mobile?.find(entry => entry.Number === env.mobile) || null;
        if (!existingMobile) {
            newChatSid.Mobile.push({ Number: env.mobile, sid: response.details.output });
        } else {
            console.log("⚠️ Conversation for this mobile number already exists.");
        }
    } else if (defaultNumber === env.phone) {
        const existingPhone = newChatSid?.Phone?.find(entry => entry.Number === env.phone) || null;
        if (!existingPhone) {
            newChatSid.Phone.push({ Number: env.phone, sid: response.details.output });
        } else {
            console.log("⚠️ Conversation for this phone number already exists.");
        }
    }
      
      var config={
        Entity:env.entity,
        APIData:{
              "id": env.entityId,
              "twiliophonenumbervalidatorbyupro__Chat_SID": JSON.stringify(newChatSid)
        },
        Trigger: ["workflow"]
      }
      await ZOHO.CRM.API.updateRecord(config)
      .then(function(data){
          console.log("sid save message" ,data)
      })
      setConversationsid(newChatSid);
      }
      catch(error){
        console.log("error in update", error)
      }
      
       // Store the conversation SID in state
        return response.details?.output;
    } catch (error) {
        console.error("❌ Error creating conversation:", error.response?.data || error);
    }
};

const addParticipant = async (conversationSid, phoneNumber, proxyNumber) => {
  try {
    var req_data ={
      "arguments": JSON.stringify({
        "conversationSid" : conversationSid,
          "phoneNumber" : phoneNumber,
          "proxyNumber" : proxyNumber
      })
    };
    const response = await ZOHO.CRM.FUNCTIONS.execute("twiliophonenumbervalidatorbyupro__add_participant", req_data)
    console.log("add participant response",response.details?.output)
      return response.details?.output;
  } catch (error) {
      console.error("❌ Error adding participant:", error.response?.details?.output || error);
  }
};

// const fetchAccessToken = async () => {
//   try {
//     var req_data ={
//       "arguments": JSON.stringify({
//         "identity" : twiliophone,
//       })
//     };
//     const response = await ZOHO.CRM.FUNCTIONS.execute("twiliophonenumbervalidatorbyupro__create_access_token", req_data)
//     console.log("acccess token response", response)
//     const output = JSON.parse(response.details.output);
//     console.log("✅ Access Token Fetched:", output.token);
//     setAccessToken(output.token);
//     return output.token;
//   } catch (error) {
//       console.error("❌ Error fetching access token:", error);
//   }
// };

const sendMessage = async (sid) => {
  // ✅ Split long messages, but return an empty array if `newMessage` is null/empty
  const messageChunks = newMessage ? splitMessageIntoChunks(newMessage) : [];

  // ✅ Check if both messageChunks and mediaSid are empty
  if (messageChunks.length === 0) {
    toast.error("Message cannot be empty unless sending media.");
    return { status: null };
  }

  let lastResponseStatus = null;

  try {
    for (const chunk of messageChunks) {
      console.log("📨 Sending message chunk:", chunk);
      const req_data = {
        arguments: JSON.stringify({
          conversation_sid: sid,
          message_body: chunk,
          twilio_phone: twiliophone,
        }),
      };

      const response = await ZOHO.CRM.FUNCTIONS.execute(
        "twiliophonenumbervalidatorbyupro__sendmessagetotwilio",
        req_data
      );
      console.log("response message", response);
      const output = JSON.parse(response.details.output);
      console.log("response message sent", output);
      lastResponseStatus = output.responseCode;

      if (output.responseCode !== 201) {
        throw new Error(`Message segment failed to send with status ${output.responseCode}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 1500)); // Add delay between chunks
    }
    // ✅ Ensure at least one request is sent (message or media)
    // if (messageChunks.length === 0) {
    //   // ✅ Send only media if there is no text message
    //   console.log("📷 Sending media only...");
    //   const req_data = {
    //     arguments: JSON.stringify({
    //       conversation_sid: sid,
    //       message_body: null, // ✅ No message text
    //       twilio_phone: twiliophone,
    //       mediaSid: mediaSid[0]
    //     }),
    //   };

    //   const response = await ZOHO.CRM.FUNCTIONS.execute(
    //     "twiliophonenumbervalidatorbyupro__sendmessagetotwilio",
    //     req_data
    //   );
    //   console.log("response message", response);
    //   const output = JSON.parse(response.details.output);
    //   console.log("response message sent", output);
    //   lastResponseStatus = output.responseCode;

    //   if (output.responseCode !== 201) {
    //     throw new Error(`Message segment failed to send with status ${output.responseCode}`);
    //   }
    // } else {
    //   // ✅ Send each message chunk with media (if available)
      
    // }

    // ✅ Clear the message input after sending
    setNewMessage("");

    if (lastResponseStatus === 201) {
      setMessageSent(true);
      setRenderCount(0);
      setShowTemplateComponent(false);
      setAttachment([]);
    }

    return { status: lastResponseStatus };
  } catch (error) {
    console.error("❌ Error sending message:", error);

    if (error.response?.data?.message === "Message body is required") {
      toast.error("Message cannot be empty.");
    } else if (error.response?.data?.message?.includes("unverified")) {
      toast.error("The number is unverified. Please verify it in Twilio.");
    } else {
      toast.error("Message not sent. Please try again later.");
    }

    return { status: error.response?.status || null };
  }
};


const handleSendMessage = async () => {
  setButtonState("loading");

  if (!newMessage.trim()) {
      toast.warn("Message cannot be empty.");
      setButtonState("idle");
      return;
  }

  try {
      let conversationSidToUse = currentConversationSid;
      console.log("conversation sid", currentConversationSid)
      // ✅ Step 1: Check if conversation exists; if not, create it
      if (!conversationSidToUse) {
          console.log("Creating a new conversation...");
          conversationSidToUse = await createConversation();
          console.log("New conversation created with SID:", conversationSidToUse);
          let participant = Promise.all([
            addParticipant(conversationSidToUse, defaultNumber, twiliophone),
            addParticipant(conversationSidToUse, twiliophone, twiliophone)
          ]);
        }
        
      if (!conversationSidToUse) {
          console.error("❌ Failed to create conversation.");
          toast.error("Failed to start conversation. Please try again.");
          return;
      }
      // let mediaSid = [];
      // if(attachment.length > 0){
      //   mediaSid = await getAttachmentSId(attachment);
      // }
      
      // ✅ Step 3: Send Message
      const messageSent = await sendMessage(conversationSidToUse);

      if (messageSent) {
          setMessageSent(true);
          fetchPreviousMessagesFromTwilio(true);
      }

      // ✅ Ensure chat scrolls to the latest message
      setTimeout(() => {
          if (chatContainerRef.current) {
              chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
      }, 200);

      setButtonState(messageSent ? "success" : "error");
  } catch (error) {
      console.error("❌ Error sending message:", error);
      toast.error("Message could not be sent. Try again.");
      setButtonState("error");
  }

  setTimeout(() => setButtonState("idle"), 5000); // Reset button state after 5 seconds
};

const fetchPreviousMessagesFromTwilio = async (initialFetch = false) => {
  if (!currentConversationSid) {
    console.error("❌ Conversation SID is missing. Cannot fetch messages.");
    return;
  }

  if (loadingMessages || (!initialFetch && nextPageTokenRef.current === null)) {
    return;
  }

  try {
    setLoadingMessages(true);
    const previousScrollHeight = chatContainerRef.current?.scrollHeight || 0;

    // ✅ Fetch latest messages from Twilio Conversations API
    const response = await axios.get(
      `https://conversations.twilio.com/v1/Conversations/${currentConversationSid}/Messages`,
      {
        auth: {
          username: accountSid,
          password: authToken,
        },
        headers: {
          "Content-Type": "application/json",
        },
        params: {
          PageSize: 20,
          Order: "desc", // ✅ Fetch newest first
          PageToken: initialFetch ? null : nextPageTokenRef.current,
        },
      }
    );

    let messages = response.data.messages || [];

    // ✅ Sort messages by `date_created` in ASCENDING order (oldest first)
    messages.sort((a, b) => new Date(a.date_created) - new Date(b.date_created));

    // ✅ Append messages at the correct position
    setMessages((prevMessages) => (initialFetch ? messages : [...messages, ...prevMessages]));

    // ✅ Update pagination token for next fetch
    nextPageTokenRef.current = response.data.meta.next_page_url
      ? new URLSearchParams(response.data.meta.next_page_url).get("PageToken")
      : null;

    // ✅ Maintain scroll position when fetching additional messages
    if (!initialFetch) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight - previousScrollHeight;
        }
      }, 100);
    } else {
      // ✅ Scroll to bottom when fetching the first set of messages
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  } catch (error) {
    console.error("❌ Error fetching messages:", error.response?.data || error);
    toast.error("Failed to load chat history.");
  } finally {
    setLoadingMessages(false);
    setRefreshFeed(false)
  }
};


// const getAttachmentSId = async () => {
//   let uploadedMediaSids = [];

//   if (!attachment || attachment.length === 0) {
//     console.error("❌ No file selected.");
//     return uploadedMediaSids;
//   }

//   const file = attachment[0]; // Get the first file
//   const filename = file.name;
//   const fileContent = await file.arrayBuffer(); // Convert file to binary

//   try {
//     // ✅ Create FormData for multipart upload
//     const formData = new FormData();
//     formData.append("file", new Blob([fileContent], { type: file.type }), filename);

//     // ✅ Prepare HTTP request for Twilio MCS
//     const request = {
//       url: `https://mcs.us1.twilio.com/v1/Services/${conversationServiceSid}/Media`,
//       method: "POST",
//       headers: {
//         "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
//       },
//       "CONTENT_TYPE": "multipart/form-data",
//       body: formData
//     };

//     // ✅ Send the request using Zoho HTTP
//     const response = await ZOHO.CRM.HTTP.post(request).then(function(data){
//       console.log("response data",data)
//   })

//     console.log("✅ Twilio MCS Response:", response);

//     // ✅ Parse the response
//     if (response.details && response.details.response) {
//       const responseData = JSON.parse(response.details.response);
//       if (responseData.sid) {
//         uploadedMediaSids.push(responseData.sid);
//         console.log("✅ Uploaded Media SID:", responseData.sid);
//       }
//     }
//   } catch (error) {
//     console.error("❌ Error uploading media to Twilio:", error);
//   }

//   setAttachmentSid(uploadedMediaSids);
//   return uploadedMediaSids;
// };

// const getAttachmentSId = async () => {
//   let uploadedMediaSids = [];

//   // ✅ Convert Files to Binary (Buffer)
// //   const fileObjects = await Promise.all(
// //     attachment.map(async (file) => {
// //       const fileContent = await file.arrayBuffer(); // Convert to binary (ArrayBuffer)
// //       const bufferContent = new Uint8Array(fileContent); // Convert to Uint8Array
// // return {file_content: bufferContent}
// //       // return {
// //       //   file_name: file.name,
// //       //   file_content: bufferContent, // Convert Uint8Array to Array (Zoho compatible)
// //       //   content_type: file.type,
// //       // };
// //     })
// //   );

//   try {
//     // ✅ Call Zoho Deluge Function (Send Raw File)
//     // const response = await ZOHO.CRM.FUNCTIONS.execute(
//     //   "twiliophonenumbervalidatorbyupro__getMediaSid",
//     //   {
//     //     arguments: JSON.stringify({
//     //       media_files: attachment, // ✅ Send as FormData
//     //     }),
//     //   }
//     // );
//     // const formData = new FormData();
//     // formData.append("file", attachment[0]);
//     var fileData = {
//       param_name: "file",
//       file: attachment[0]
//   };
//     // const filename = attachment[0].name
//     // const fileContent = await attachment[0].arrayBuffer();
//     var request ={
//       url : `https://mcs.us1.twilio.com/v1/Services/${conversationServiceSid}/Media`,

//       headers: {
//         "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
//         "Content-Type": "multipart/form-data"
//     },
//     params: fileData,
//     method: "POST"
//   }

//   const response = await ZOHO.CRM.HTTP.post(request)
//   .then(function(data){
//       console.log(data)
//   })
//     console.log("Response from Zoho:", response);

//     // const output = JSON.parse(response.details.output);
//     // if (output.status_code === 200) {
//     //   uploadedMediaSids = output.uploaded_media_sids;
//     // }
//   } catch (error) {
//     console.error("❌ Error uploading media to Zoho:", error);
//   }

//   setAttachmentSid(uploadedMediaSids);
//   return uploadedMediaSids;
// };

// const uploadFilesToTwilio = async (files) => {
//   try {
//     const formData = new FormData();
//     attachment.forEach(file => formData.append("files", file));

//     const response = await fetch("https://127.0.0.1:5000/upload-to-twilio", {
//       method: "POST",
//       body: formData,
//       headers: {
//         "accountSid": accountSid,
//         "authToken": authToken,
//         'serviceSid': conversationServiceSid,
//       }
//     });

//     const result = await response.json();
//     console.log("✅ Twilio Media SIDs:", result.mediaSids);
//     return result.mediaSids;
//   } catch (error) {
//     console.error("❌ Error uploading files:", error);
//   }
// };

  return (
    <Box className="twilioChatContainer">
      {loading ? (
        <div className="skeletonLoader">
          <div className="skeletonHeader">
            <div className="receiverSkeleton">
            <Skeleton variant="rectangular" width={50} height={50} sx={{ borderRadius: "50%" }}/>
            <Skeleton variant="rectangular" width={200} height={50} sx={{ borderRadius: "10px" }}/>
            <Skeleton variant="rectangular" width={200} height={50} sx={{ borderRadius: "10px" }}/>
            </div>
            <div className="clientSkeleton">
            <Skeleton variant="rectangular" width={200} height={50} sx={{ borderRadius: "10px" }}/>
            <Skeleton variant="rectangular" width={50} height={50} sx={{ borderRadius: "50%" }}/>
            </div>
          </div>
          <div className="chatSkeleton">
            <div className="sentSkeleton">
              <Skeleton variant="rectangular" width={300} height={50} sx={{ borderRadius: "10px", marginBottom: '10px' }}/>
              <Skeleton variant="rectangular" width={150} height={50} sx={{ borderRadius: "10px",marginBottom: '10px' }}/>
              <Skeleton variant="rectangular" width={200} height={60} sx={{ borderRadius: "10px",marginBottom: '10px' }}/>
            </div>
            <div className="receiveSkeleton">
          <Skeleton variant="rectangular" width={250} height={100} sx={{ borderRadius: "10px",marginBottom: '10px' }}/>
          <Skeleton variant="rectangular" width={400} height={50} sx={{ borderRadius: "10px" }}/>
            </div>
          </div>
          <div className="inputSkeleton">
          <Skeleton variant="rectangular" width={50} height={50} sx={{ borderRadius: "50%" }}/>
          <Skeleton variant="rectangular" width={50} height={50} sx={{ borderRadius: "50%" }}/>
          <Skeleton variant="rectangular" width={550} height={50} sx={{ borderRadius: "10px" }}/>
          <Skeleton variant="rectangular" width={50} height={50} sx={{ borderRadius: "50%" }}/>
          </div>
        </div>
      ) : !accountSid && !authToken ? (
        <div className="missingCredientialContainer">
        <img src={confused} alt="missingCrediential" />
        <img src={phoneImage} alt="missingCrediential" />
        </div>
      ) : (
        <>
          <Box className="chatHeader">
            <div className="chatLogo">
              <IoMdPerson />
            </div>
            <div className="detailsContainer">
              <div className="clientDetails">
                <span>Receiver:</span>
                <span>{env.full_name}</span>
                {env.mobile == "Number Needed" &&
                  env.phone == "Number Needed" ? (
                  <span id="clientDetailsSpan">Mobile/Phone number not present</span>
                ) : (
                  <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={defaultNumber}
                    label="Number"
                    onChange={handleDefaultNumberChange}
                    sx={{
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                    }}
                  >
                    <MenuItem value={env.phone} disabled={!phoneValid}>
                      <span className="menuItemOption"
                        style={{opacity: phoneValid ? 1 : 0.5}}
                      >
                        Phone {env.phone}{" "}
                        {!phoneValid && (
                          <FiAlertCircle
                            title="Invalid Number"
                            style={{ color: "red" }}
                          />
                        )}
                      </span>
                    </MenuItem>

                    <MenuItem value={env.mobile} disabled={!mobileValid}>
                      <span className="menuItemOption"
                        style={{opacity: mobileValid ? 1 : 0.5}}
                      >
                        Mobile {env.mobile}{" "}
                        {!mobileValid && (
                          <FiAlertCircle
                            title="Invalid Number"
                            style={{ color: "red" }}
                          />
                        )}
                      </span>
                    </MenuItem>
                  </Select>
                )}
              </div>
              <div className="senderDetails">
                {twilioPhoneNumbers.length === 0 ? (
                  <p>No numbers available.</p>
                ) : (
                  <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    displayEmpty
                    value={twiliophone || ""}
                    label="Number"
                    onChange={handleSelectionChange}
                    sx={{
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      Select a number
                    </MenuItem>
                    {twilioPhoneNumbers.map((data, index) => (
                      <MenuItem
                        key={index}
                        value={data.number}
                        disabled={data.status === "inactive"}
                      >
                        <div style={{display: 'flex', gap: '10x'}}>
                          <span style={{fontSize: '15px', fontWeight: '700'}}>{data.friendlyName}</span>
                          <span style={{fontSize: '15px', fontWeight: '300'}}>{data.number}</span>
                          {data.status === "inactive" && (<span style={{fontSize: '14px', fontWeight: '600', color: 'red'}}>Inactive</span>)}
                        </div>
                      </MenuItem>
                    ))}
                  </Select>
                )}
                <button id="refreshButton" onClick={handleRefershFeed}>
                  {refreshFeed ? <img src={eclipse} alt="" /> : <TbReload />}
                </button>
              </div>
            </div>
          </Box>
          <Box className="chatContainer" ref={chatContainerRef}>
            {loadingMessages && (
              <div className="topLoaderContainer">
                <img src={loaderGIF} alt="Loading..." className="topLoader" />
              </div>
            )}

            {messages.length > 0 ? (
              <>
                {!nextPageTokenRef.current && (
                    <div className="endOfChatContainer">
                      <p>— End of Chat History —</p>
                    </div>
                  )}
                {messages.map((message, index) => {
                  const isSent = message.author === twiliophone || message.author === "system" ? message.author : null;

                  const showDateSeparator =
                    index === 0 ||
                    formatDate(messages[index - 1].date_created) !==
                      formatDate(message.date_created);

                  return (
                    <React.Fragment key={message.sid}>
                      {showDateSeparator && (
                        <Divider>
                          <div className="dateSeparator">
                            {formatDate(message.date_created)}
                          </div>
                        </Divider>
                      )}
                      <div className={`message ${isSent ? "sent" : "received"}`}>
                        <div className="messageContent">
                          {isSent && message.delivery == null && (
                            <Tooltip title="Twilio error">
                              <span className="leftErrorIcon">
                                <FiAlertCircle />
                              </span>
                            </Tooltip>
                          )}
                          <div
                            style={{ whiteSpace: "pre-wrap", fontSize: "15px" }}
                            dangerouslySetInnerHTML={{
                              __html: formatMessage(message.body),
                            }}
                          />
                          {message.media && (
      <MediaPlaceholder conversationSid={conversationsid} mediaSid={message.media[0].sid}/>
    )}
                          <div className="messageFooter">
                            <span className="time">
                              {new Date(message.date_created).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )}
                            </span>
                            {isSent && (
                              <span className="statusIcon">
                                {getMessageStatusIcon(message.delivery)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                    </React.Fragment>
                  );
                })}
              </>
            ) : (
              <>
                <div className="emptyContainer">
                  <img src={emptyChatLog} />
                </div>
                <Dialog
                  open={showNoNumberModal}
                  onClose={() => setShowNoNumberModal(false)}
                  sx={{
                    "& .MuiPaper-root": {
                      background: "#e3e2e8",
                      borderRadius: "20px",
                      boxShadow: "inset 2px 2px 9px 4px #ffff, inset -2px -2px 5px 2px #aaa6a !important",
                    }
                  }}
                >
                  <DialogTitle
                    style={{
                      fontWeight: "bold",
                      textAlign: "center",
                      color: "#d32f2f",
                    }}
                  >
                    No Default Number Selected!
                  </DialogTitle>
                  <DialogContent
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems:'center', justifyContent:'center'
                  }}>
                    <p>
                      Please choose a valid phone number before proceeding.
                    </p>
                    <p style={{textAlign: 'center'}}>
                      If you need to set a default number, update your
                      settings in the SMS configuration panel.
                    </p>
                    <p>Need help? Contact support for assistance.</p>
                  </DialogContent>
                  <DialogActions sx={{justifyContent: 'center'}}>
                    <Button
                      onClick={() => setShowNoNumberModal(false)}
                      color="primary"
                      variant="contained"
                    >
                      Close
                    </Button>
                  </DialogActions>
                </Dialog>
              </>
            )}
          </Box>
          <Box className="chatInputContainer">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="emojiButton"
            >
              <GrEmoji />
            </button>
            {showEmojiPicker && (
              <div className="emojiContianer">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  style={{ width: "430px", height: "315px" }}
                />
              </div>
            )}
            <button onClick={handleShowTemplate} className="emojiButton">
              <RiSlashCommands2 />
            </button>
            {showTemplateComponent && (
              <TemplateComponent
                className="templateContainer"
                showTemplate={showTemplateComponent}
                handleTemplateContentChange={handleTemplateContentChange}
                setShowTemplateComponent={setShowTemplateComponent}
                setNewMessage={setNewMessage}
              />
            )}
            <button onClick={handleMediaComponent} className="emojiButton">
          <CgAttachment/>
        </button>
        {
          mediaComponent && (
            <MediaComponent className="mediaComponent" mediaComponent={mediaComponent} attachment={attachment} setAttachment={setAttachment}/>
          )
        }

            <div className="textarea-container">
              <textarea
                ref={textareaRef}
                rows={1} // Default row height
                className={`message-input ${showPopUp ? "exceed-warning" : ""}`}
                value={newMessage}
                onChange={handleInputChange}
                placeholder="Type your message here..."
              />
              {showPopUp && (
                <div className="textarea-warning">
                  Character limit exceeded, message will be sent in segments.
                </div>
              )}
            </div>
            <button
              className={`button ${
                buttonState === "loading" ? "animate" : ""
              } ${buttonState === "success" ? "animate success" : ""} ${
                buttonState === "error" ? "animate error" : ""
              }`}
              onClick={handleSendMessageClick}
              disabled={buttonState === "loading"}
            >
              <IoIosSend />
            </button>
          </Box>
          <ToastContainer
            position="top-center"
            className="custom-toast-container"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </>
      )}
    </Box>
  );
};

export default ChatComponent;
