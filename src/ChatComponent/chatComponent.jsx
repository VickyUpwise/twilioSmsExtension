import React, { useState, useEffect, useRef } from "react";
import { Box, Select, MenuItem } from "@mui/material";
import { LuAlertCircle } from "react-icons/lu";
import { IoIosSend, IoMdPerson } from "react-icons/io";
import { IoCheckmarkDoneOutline } from "react-icons/io5";
import { MdOutlineWatchLater, MdDone, MdQueryBuilder } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import { GrEmoji } from "react-icons/gr";
import { RxCross1 } from "react-icons/rx";
import { GrRefresh } from "react-icons/gr";
import { RiSlashCommands2 } from "react-icons/ri";
import emptyChatLog from "../utility/emptyChatLog.jpg";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import "./chatComponent.scss";
import "react-toastify/dist/ReactToastify.css";
import TemplateComponent from "../TemplateComponent/templateComponent";

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
  const [timer, setTimer] = useState(null); // Timer for countdown
  const [isCountdownActive, setIsCountdownActive] = useState(false); //
  const [timeoutId, setTimeoutId] = useState(null);
  const [messageSent, setMessageSent] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [showTemplateComponent, setShowTemplateComponent] = useState(false);
  const [templateCont, setTemplateCont] = useState('')

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
      fetchPreviousMessagesFromTwilio();
    }
  }, [defaultNumber, twiliophone]);

  useEffect(() => {
    let intervalId;
  
    if (messageSent && renderCount === 0) {
      // Only setup interval on the first execution
      toast("Refreshing the feed. Please wait...");
      fetchPreviousMessagesFromTwilio(); // Initial fetch
      setRenderCount(1); // Set the render count to 1 to prevent duplicate intervals
  
      let currentCount = 1; // Local count to avoid state re-triggering
  
      intervalId = setInterval(() => {
        if (currentCount >= 3) {
          clearInterval(intervalId); // Stop the interval after 3 executions
          setMessageSent(false); // Reset messageSent for the next use
        } else {
          toast("Refreshing the feed. Please wait...");
          fetchPreviousMessagesFromTwilio();
          currentCount++; // Increment local count
          setRenderCount(currentCount); // Update render count
        }
      }, 110000); // 2 minutes interval
    }
  
    return () => clearInterval(intervalId); // Clean up interval on component unmount
  }, [messageSent]);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (newMessage.length > 1600) {
      setShowPopUp(true); // Explicitly show the popup
    }
    else(
      setShowPopUp(false)
    )
  }, [newMessage])

  useEffect(() => {
    if (isCountdownActive && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval); // Cleanup on component unmount or countdown stop
    } else if (timer === 0 && isCountdownActive) {
      handleSendMessage(); // Automatically send the message after countdown
    }
  }, [isCountdownActive, timer]);

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
      setDefaultNumber(entityData.Phone);
    } catch (error) {
      console.log("error", error);
    }
  };

  // Fetch Message history of the user and entity
  const fetchPreviousMessagesFromTwilio = async () => {
    if (!defaultNumber.startsWith("+")) {
      toast.error("Phone/mobile number must include a country code.");
    } else {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

        // Fetch inbound and outbound messages
        const [inboundResponse, outboundResponse] = await Promise.all([
          axios.get(url, {
            auth: { username: accountSid, password: authToken },
            params: { From: defaultNumber, To: twiliophone },
          }),
          axios.get(url, {
            auth: { username: accountSid, password: authToken },
            params: { From: twiliophone, To: defaultNumber },
          }),
        ]);

        const inboundMessages = inboundResponse.data.messages;
        const outboundMessages = outboundResponse.data.messages;

        // Combine inbound and outbound messages
        const allMessages = [...inboundMessages, ...outboundMessages];

        // Sort messages by both date and time
        allMessages.sort(
          (a, b) => new Date(a.date_sent) - new Date(b.date_sent)
        );
        setMessages(allMessages);
      } catch (error) {
        console.error("Error fetching messages from Twilio:", error);
        toast.error("Network Error, Chat history not loaded");
      }
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
          To: defaultNumber, // Lead/Contact phone number
        });

        const response = await axios.post(url, data, {
          auth: auth,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });

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
        console.log("Message sent called.")
        setMessageSent(true); 
        setRenderCount(0);
      }
      fetchPreviousMessagesFromTwilio();
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
      .replace(/\n/g, "<br />"); // handle line break in the chats.
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
        return <LuAlertCircle />;
      default:
        return null;
    }
  };

  // Handling the choice between lead/contact mobile or phone number.
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
    setNewMessage(e.target.value);
  };

  const handleEmojiClick = (emojiObject) => {
    setNewMessage((prevMessage) => prevMessage + emojiObject.emoji);
  };

  const handleSendMessageClick = () => {
    if (!newMessage.trim()) {
      toast.error("Message cannot be empty.");
      return;
    }
    setIsCountdownActive(true); // Start the countdown
    setTimer(10); // Set countdown to 10 seconds

    const timeout = setTimeout(() => {
      handleSendMessage();
    }, 10000); // Send message after 10 seconds
    setTimeoutId(timeout);
  };

  const handleSendMessage = async () => {
    setIsCountdownActive(false); // Stop showing countdown
    setButtonState("loading");
    try {
      const response = await sendMessage();
      if (response.status === 201) {
        setButtonState("success");
      } else {
        setButtonState("error");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setButtonState("error");
    }
    setTimeout(() => setButtonState("idle"), 5000); // Reset button state after 5 seconds
  };

  const cancelSendMessage = () => {
    clearTimeout(timeoutId); // Clear the timeout to cancel message sending
    setIsCountdownActive(false); // Stop countdown
    setTimer(null); // Reset timer
    setButtonState(""); // Reset button state
  };

  const handleRefershFeed = () => {
    toast("Refreshing the feed. Please wait....")
    fetchPreviousMessagesFromTwilio();
  }

  const handleShowTemplate = () => {
    setShowTemplateComponent(!showTemplateComponent)
  }

  const handleTemplateContentChange = (content) => {
    setTemplateCont(content);
    setNewMessage(content)
  };
  return (
    <Box className="twilioChatContainer">
      <Box className="chatHeader">
        <div className="chatLogo"><IoMdPerson /></div>
        <div className="clientDetails">
          <span>Conversation</span>
          <span>with</span>
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
            <MenuItem value={env.phone}>{env.phone}</MenuItem>
            <MenuItem value={env.mobile}>{env.mobile}</MenuItem>
          </Select>
          <span>from</span>
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
          <button id='refreshButton' onClick={handleRefershFeed}><GrRefresh /></button>
        </div>
      </Box>
      <Box className="chatContainer" ref={chatContainerRef}>
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
                  <div className="dateSeparator">
                    {formatDate(message.date_sent)}
                  </div>
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
            <p>No messages here yet......</p>
            <img src={emptyChatLog} />
            <p>Send a message</p>
          </div>
        )}
      </Box>
      <Box className="chatInputContainer">
        {
          showPopUp && (
            <p>Character limit exceed, message will be sent in parts.</p>
          )
        }
        {
          showTemplateComponent && (
            <TemplateComponent className='templateContainer' showTemplate={showTemplateComponent} handleTemplateContentChange={handleTemplateContentChange}/>
          )
        }
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="emojiButton"
        >
          <GrEmoji />
        </button>
        <button 
        onClick={handleShowTemplate}
        className="emojiButton"
        >
        <RiSlashCommands2 />
        </button>
        {showEmojiPicker && (
          <div style={{ position: "absolute", bottom: "14%", left: "5%", zIndex: 10 }}>
            <EmojiPicker onEmojiClick={handleEmojiClick} style={{width: '430px', height: '315px'}}/>
          </div>
        )}
        <textarea
          className="message-input"
          value={newMessage}
          onChange={handleInputChange}
          placeholder="Type your message here..."
        />
        {
          !isCountdownActive ? (
        <button
          className={`button ${buttonState === "loading" ? "animate" : ""} ${
            buttonState === "success" ? "animate success" : ""
          } ${buttonState === "error" ? "animate error" : ""}`}
          onClick={handleSendMessageClick}
          disabled={buttonState === "loading"}
        >
          <IoIosSend />
        </button>
          ) : (
            <div className="button">
              <div className="timer">{timer}</div>
              <button className="cancelSend" onClick={cancelSendMessage}><RxCross1 /></button>
            </div>
          )
        }
      </Box>
      <ToastContainer 
        position="bottom-left"
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
