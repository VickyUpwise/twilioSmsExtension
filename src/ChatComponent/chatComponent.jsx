import React, { useState, useEffect, useRef } from "react";
import { Box, Select, MenuItem} from "@mui/material";
import { FiAlertCircle } from "react-icons/fi";
import { IoIosSend, IoMdPerson } from "react-icons/io";
import { IoCheckmarkDoneOutline } from "react-icons/io5";
import { MdOutlineWatchLater, MdDone, MdQueryBuilder } from "react-icons/md";
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
import eclipse from '../utility/reload.gif'
import Divider from '@mui/material/Divider';
import loaderGIF from '../utility/Loader.gif'

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
  const [twilioPhoneNumbers, setTwilioPhoneNumbers] = useState([])
  const [showPopUp, setShowPopUp] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [defaultNumber, setDefaultNumber] = useState("");
  const chatContainerRef = useRef(null);
  const [messageSent, setMessageSent] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [showTemplateComponent, setShowTemplateComponent] = useState(false);
  const [templateCont, setTemplateCont] = useState('')
  const [attachment, setAttachment] = useState(null);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [mediaComponent , setMediaComponent] = useState(false);
  const [refreshFeed, setRefreshFeed] = useState(false)
  const textareaRef = useRef(null);
  const [loadingMessages, setLoadingMessages] = useState(false); // Prevent multiple fetch calls
  const nextPageTokenRef = useRef(null);

  //fetch the entity data and Twilio Account Details on pageload
  useEffect(() => {
    ZOHO.embeddedApp.on("PageLoad", function (data) {
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
  }, [env.entity, env.entityId]);

  // fetch chat history
  useEffect(() => {
    if (twiliophone && defaultNumber) {
      setMessages([])
      fetchPreviousMessagesFromTwilio(true);
    }
}, [defaultNumber, twiliophone]);

useEffect(() => {
  let intervalId;

  if (messageSent && renderCount === 0) {
      fetchPreviousMessagesFromTwilio(true);
      setRenderCount(1);

      let currentCount = 1;
      let intervalTimes = [30000, 60000, 90000, 120000];

      const executeFetch = () => {
          if (currentCount >= intervalTimes.length) {
              clearInterval(intervalId);
              setMessageSent(false);
          } else {
              fetchPreviousMessagesFromTwilio(true);
              currentCount++;
              setRenderCount(currentCount);
              toast(`refreshing the feed for ${currentCount} time.`);
              intervalId = setTimeout(executeFetch, intervalTimes[currentCount]);
          }
      };

      intervalId = setTimeout(executeFetch, intervalTimes[currentCount - 1]);
  }

  return () => clearTimeout(intervalId);
}, [messageSent]);

  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (chatContainerRef.current) {
        const handleScroll = () => {
            if (chatContainerRef.current.scrollTop === 0) {
                fetchPreviousMessagesFromTwilio();
            }
        };
        chatContainerRef.current.addEventListener("scroll", handleScroll);
        return () => chatContainerRef.current.removeEventListener("scroll", handleScroll);
    }
}, [twiliophone, defaultNumber]);

  useEffect(() => {
    if (newMessage.length > 1600) {
      setShowPopUp(true); // Explicitly show the popup
    }
    else(
      setShowPopUp(false)
    )
    if (!newMessage) {
      textareaRef.current.style.height = "30px"; // Reset height after sending message
  }
  }, [newMessage])

  // fetching twilio account details.
  const fetchAccountDetails = async () => {
    try {
      const twilioSID = await ZOHO.CRM.API.getOrgVariable("twiliophonenumbervalidatorbyupro__Twilio_SID");
      const twilioToken = await ZOHO.CRM.API.getOrgVariable("twiliophonenumbervalidatorbyupro__Twilio_Token");
      const currentTwilioNumber = await ZOHO.CRM.API.getOrgVariable("twiliophonenumbervalidatorbyupro__Current_Twilio_Number");
      const twiliophonenumbers = await ZOHO.CRM.API.getOrgVariable("twiliophonenumbervalidatorbyupro__Phone_Numbers");
      

      const sidContent = twilioSID.Success.Content;
      const tokenContent = twilioToken.Success.Content;
      const numberContent = currentTwilioNumber.Success.Content;
      const numberlist = JSON.parse(twiliophonenumbers.Success.Content);
      
      if (sidContent === "") {
        setAccountSid("");
        toast.error("Account SID not present. Please refer to settings page.");
      } else {
        setAccountSid(sidContent);
      }

      if (tokenContent === "") {
        setAuthToken("");
        toast.error(
          "Account Token not present. Please refer to settings page."
        );
      } else {
        setAuthToken(tokenContent);
      }

      if (numberContent === "") {
        setTwilioPhone("");
        toast.error(
          "Please Choose a number from the number list."
        );
      } else {
        setTwilioPhone(numberContent);
      }


      if(twiliophonenumbers === ''){
        setTwilioPhoneNumbers('')
        toast.error(
          "Twilio Phone number not present. Please refer to settings page."
        );
      }
      else{
        setTwilioPhoneNumbers(numberlist)
      }

      
    } catch (error) {
      console.error("Error getting Account Details", error);
      toast.error("Something went wrong. Please try again");
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
      setEnv((prevEnv) => ({
        ...prevEnv,
        full_name: entityData.Full_Name,
        phone: entityData.Phone || '',
        mobile: entityData.Mobile || '',
      }));
      setDefaultNumber(entityData.Mobile || '');
    } catch (error) {
      console.log("error", error);
    }
  };

const fetchPreviousMessagesFromTwilio = async (initialFetch = false) => {
  if (!twiliophone || !defaultNumber) {
      toast.error("Twilio phone number and default number must be set.");
      return;
  }
  if (!defaultNumber.startsWith("+")) {
      toast.error("Phone/mobile number must include a country code.");
      return;
  }
  if (loadingMessages) return; // Prevent duplicate calls while fetching
   // Stop fetching if no more messages left
   if (!initialFetch && !nextPageTokenRef.current) {
    toast.info("No more chat history.");
    return;
}
  try {
      setLoadingMessages(true); // Start fetching
      const previousScrollHeight = chatContainerRef.current ? chatContainerRef.current.scrollHeight : 0;
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

      let params = {
          PageSize: 20, // Fetch 20 messages per request
          To: defaultNumber,
          From: twiliophone,
      };

      if (!initialFetch && nextPageTokenRef.current) {
          params.PageToken = nextPageTokenRef.current; // Fetch next page
      }

      const response = await axios.get(url, {
          auth: { username: accountSid, password: authToken },
          params: params,
      });

      const newMessages = response.data.messages || [];
      console.log("Fetched messages:", newMessages);

      if (newMessages.length === 0) {
          console.log("No more messages to load.");
          setLoadingMessages(false);
          return;
      }

      // Sort messages by date
      newMessages.sort((a, b) => new Date(a.date_sent) - new Date(b.date_sent));
      setRefreshFeed(false)
      // Prevent duplicate messages
      setMessages((prevMessages) => {
          const existingSids = new Set(prevMessages.map(msg => msg.sid));
          const uniqueMessages = newMessages.filter(msg => !existingSids.has(msg.sid));
          return initialFetch ? newMessages : [...uniqueMessages, ...prevMessages];
      });

      // Safely set next page token for pagination
      const newPageToken = response.data.next_page_uri ? new URLSearchParams(response.data.next_page_uri).get('PageToken') : null;
      nextPageTokenRef.current = newPageToken;
      console.log("Next PageToken:", newPageToken);
      if(!initialFetch){
        setTimeout(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight - previousScrollHeight;
            }
        }, 100);
      }

  } catch (error) {
      console.error("Error fetching messages from Twilio:", error);
      toast.error("Network Error, Chat history not loaded");
  } finally {
      setLoadingMessages(false); // Reset loading state
  }
};
  // Sending Message using twilio
  const MAX_TWILIO_CHAR_LIMIT = 1600; // Twilio's character limit for long messages

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

  const sendMessage = async () => {
    const messageChunks = splitMessageIntoChunks(newMessage); // Split the message into chunks
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const auth = {
      username: accountSid,
      password: authToken,
    };

    let lastResponseStatus = null;

    try {
      // Send each message chunk separately
      for (const chunk of messageChunks) {
        const data = new URLSearchParams({
          Body: chunk, // Message content
          From: twiliophone, // Your Twilio phone number
          To: defaultNumber,// Lead/Contact phone number
        });

        const response = await axios.post(url, data, {
          auth: auth,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
        console.log('response', response)
        lastResponseStatus = response.status;

        if (response.status !== 201) {
          throw new Error(
            `Message segment failed to send with status ${response.status}`
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      setNewMessage("");
      if(lastResponseStatus === 201){
        setMessageSent(true); 
        setRenderCount(0);
        setShowTemplateComponent(false)
      }
      fetchPreviousMessagesFromTwilio(true);
      return { status: lastResponseStatus };
    } catch (error) {
      console.error("Error sending message:", error);
      if (error.response?.data?.message === "Message body is required") {
        toast.error("Message cannot be empty.");
      } else if (error.response?.data?.message.includes("unverified")) {
        toast.error("The number is unverified. Please verify it in Twilio.");
      } else {
        toast.error("Message not sent. Please try again later.");
      }
      return { status: error.response?.status || null };
    }
  };

  const sendAttachment = async () => {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = {
      username: accountSid,
      password: authToken,
    };
  
    const data = new URLSearchParams({
      MediaUrl: [
        attachmentUrl,
      ],
      From: twiliophone, // Your Twilio phone number
      To: defaultNumber,// Lead/Contact phone number
    });
  
    try {
      const response = await axios.post(url, data, {
        auth,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
  
      if (response.status !== 201) {
        throw new Error(`Attachment failed with status ${response.status}`);
      }
      console.log('Media response',response)
      fetchPreviousMessagesFromTwilio(true);
      setAttachment('')
      setAttachmentUrl('')
      setShowTemplateComponent(false);

      return response.status;
    } catch (error) {
      console.log('error sending attachment', error)
    }
  };

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
    const formattedMessage = message
      .replace("Sent from your Twilio trial account - ", "") // format the message according to chatting application
      .replace(/\n/g, "<br />") // handle line breaks in the chats
      .replace(/(https?:\/\/[^\s]+)/g, (url) => {
        // Make URLs clickable
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      });
  
    return formattedMessage;
  };

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case "queued":
        return <MdQueryBuilder />;
      case "sending":
        return <MdOutlineWatchLater />;
      case "sent":
        return <MdDone />;
      case "delivered":
        return <IoCheckmarkDoneOutline />;
      case "failed":
        return <FiAlertCircle />;
      default:
        return null;
    }
  };
  
  const handleDefaultNumberChange = (e) => {
    setDefaultNumber(e.target.value);
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
    if (!attachmentUrl && !newMessage.trim()) {
      toast.error("Message cannot be empty.");
      return;
    }
    handleSendMessage();
  };

  const handleSendMessage = async () => {
    setButtonState("loading");
  
    if (attachment && !attachmentUrl) {
      alert("Attachment is still uploading. Please wait.");
      setButtonState("idle");
      return;
    }
  
    try {
      let isSuccess = false;
  
      if (newMessage && !attachmentUrl) {
        // Case 1: Only message content
        const response = await sendMessage();
        isSuccess = response.status === 201;
      } else if (!newMessage && attachmentUrl) {
        // Case 2: Only attachment
        const response = await sendAttachment();
        isSuccess = response === 201;
      } else if (newMessage && attachmentUrl) {
        // Case 3: Both message and attachment
        const attachmentResponse = await sendAttachment();
        if (attachmentResponse === 201) {
          const messageResponse = await sendMessage();
          isSuccess = messageResponse.status === 201;
        }
      } else {
        // Default Case: No message or attachment
        toast.warn("Please provide a message or an attachment to send.");
        setButtonState("idle");
        return;
      }
      if (isSuccess) {
        setTimeout(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        }, 200); // Ensure chat stays at the bottom
    }
      setButtonState(isSuccess ? "success" : "error");
    } catch (error) {
      console.error("Error sending message or attachment:", error);
      setButtonState("error");
    }
  
    setTimeout(() => setButtonState("idle"), 5000); // Reset button state after 5 seconds
  };
  
  const handleRefershFeed = () => {
    setRefreshFeed(true)
    fetchPreviousMessagesFromTwilio(true);
  }

  const handleShowTemplate = () => {
    setShowTemplateComponent(!showTemplateComponent)
  }

  const handleTemplateContentChange = (content) => {
    setTemplateCont(content);
    setNewMessage(content)
    setTimeout(() => {
      if (textareaRef.current) {
          textareaRef.current.style.height = "auto"; // Reset height
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Expand based on content
      }
  }, 0);
  };

  const handleMediaComponent = () => {
    setMediaComponent(!mediaComponent)
  }

  return (
    <Box className="twilioChatContainer">
      <Box className="chatHeader">
        <div className="chatLogo"><IoMdPerson /></div>
        <div className="detailsContainer">
        <div className="clientDetails">
          <span>Receiver:</span>
          <span>{env.full_name}</span>
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
            <MenuItem value={env.phone}><span style={{fontSize: '15px', fontWeight: 'bold', margin: '0px 5px'}}>Phone</span>{env.phone}</MenuItem>
            <MenuItem value={env.mobile}><span style={{fontSize: '15px', fontWeight: 'bold', margin: '0px 5px'}}>Mobile</span>{env.mobile}</MenuItem>
          </Select>
        </div>
        <div className="senderDetails">
          {
              twilioPhoneNumbers.length === 0 ? (
                <p>No numbers available.</p>
              ) : (
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={twiliophone}
            label="Number"
            onChange={handleSelectionChange}
            sx={{
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          >
            {twilioPhoneNumbers.map((data, index) => (
            <MenuItem key={index} value={data.number}>
              <div style={{display: 'flex', gap: '10px'}}>
                <span style={{ fontSize: '15px', fontWeight: '700'}}>{data.friendlyName}</span>
                <span style={{ fontSize: '15px', fontWeight: '300'}}>{data.number}</span>
              </div>
            </MenuItem>
          ))}
          </Select>
          )
        }
          <button id='refreshButton' onClick={handleRefershFeed}>
            {refreshFeed ? <img src={eclipse} alt="" />: <TbReload />}</button>
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
          messages.map((message, index) => {
            const isSent = message.from === twiliophone;
            const showDateSeparator =
              index === 0 ||
              formatDate(messages[index - 1].date_sent) !==
                formatDate(message.date_sent);

            return (
              <React.Fragment key={message.sid}>
                {showDateSeparator && (
                  <Divider>
                      <div className="dateSeparator">
                      {formatDate(message.date_sent)}
                      </div>
                  </Divider>
                )}
                <div className={`message ${isSent ? "sent" : "received"}`}>
                  <div className="messageContent">
                    <div
                      style={{ whiteSpace: "pre-wrap", fontSize: "15px" }}
                      dangerouslySetInnerHTML={{
                        __html: formatMessage(message.body),
                      }}
                    />
                    <div className="messageFooter">
                      <span className="time">
                        {new Date(message.date_sent).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                      {isSent && (
                        <span className="statusIcon">
                          {getMessageStatusIcon(message.status)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        ) : (
          <div className="emptyContainer">
            
            <img src={emptyChatLog} />
           
          </div>
        )}
      </Box>
      <Box className="chatInputContainer">
        
        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="emojiButton">
          <GrEmoji />
        </button>
        {showEmojiPicker && (
          <div style={{ position: "absolute", bottom: "14%", left: "5%", zIndex: 10 }}>
            <EmojiPicker onEmojiClick={handleEmojiClick} style={{width: '430px', height: '315px'}}/>
          </div>
        )}
        <button onClick={handleShowTemplate} className="emojiButton">
          <RiSlashCommands2 />
        </button>
        {
          showTemplateComponent && (
            <TemplateComponent className='templateContainer' showTemplate={showTemplateComponent} handleTemplateContentChange={handleTemplateContentChange} setShowTemplateComponent={setShowTemplateComponent} setNewMessage={setNewMessage}/>
          )
        }
        {/* <button onClick={handleMediaComponent} className="emojiButton">
          <CgAttachment/>
        </button>
        {
          mediaComponent && (
            <MediaComponent className="mediaComponent" authToken={authToken} accountSid={accountSid} mediaComponent={mediaComponent} attachment={attachment} attachmentUrl={attachmentUrl} setAttachment={setAttachment} setAttachmentUrl={setAttachmentUrl}/>
          )
        } */}

<div className="textarea-container">
      <textarea
        ref={textareaRef}
        rows={1} // Default row height
        className={`message-input ${showPopUp ? "exceed-warning" : ""}`}
        value={newMessage}
        onChange={handleInputChange}
        placeholder="Type your message here..."
        style={{
          width: "44rem",
          minHeight: "30px",
          maxHeight: "90px", // Limit max height
          fontSize: "13px",
          borderRadius: "10px",
          outline: "none",
          bottom: '0px',
          position: 'relative',
          resize: "none",
          overflow: "hidden scroll", // Prevent scrollbars
          transition: "height 0.2s ease",
        }}
      />
      {showPopUp && (
        <div className="textarea-warning">
          Character limit exceeded, message will be sent in parts.
        </div>
      )}
    </div>
        <button
          className={`button ${buttonState === "loading" ? "animate" : ""} ${
            buttonState === "success" ? "animate success" : ""
          } ${buttonState === "error" ? "animate error" : ""}`}
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
    </Box>
  );
};

export default ChatComponent;
