import React, { useState, useEffect, useRef } from "react";
import { Box, Select, MenuItem, Tooltip, Modal } from "@mui/material";
import { FiAlertCircle } from "react-icons/fi";
import { IoCheckmarkDoneOutline } from "react-icons/io5";
import { MdOutlineWatchLater, MdDone, MdQueryBuilder } from "react-icons/md";
import { IoCloseCircleOutline } from "react-icons/io5";
import { IoMailUnreadOutline } from "react-icons/io5";
import { toast, ToastContainer } from "react-toastify";
import { TbReload } from "react-icons/tb";
import emptyChatLog from "../../utility/image.png";
import "./chatComponent.scss";
import "react-toastify/dist/ReactToastify.css";
import eclipse from "../../utility/reload.gif";
import Divider from "@mui/material/Divider";
import loaderGIF from "../../utility/Loader.gif";
import { PiGearSixFill } from "react-icons/pi";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Skeleton,
} from "@mui/material";
import twilioErrors from "../../utility/errors.json";
import MediaPlaceholder from "../MediaPlaceholder/mediaPlaceholder";
import DOMPurify from "dompurify";
import axios from "axios";
import Settings from "../Settings/setting";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
import { useTwilioConfig } from "../../ContextApi/twilioConfigContext";
import { useConversationContext } from "../../ContextApi/fetchPreviousMessages";
import { validatePhoneNumberAPI } from "../../ContextApi/twilioApis";
import FooterComponent from "../FooterComponent/footerComponent";

const ChatComponent = () => {
  const { twilioConfig, dispatchTwilioConfig } = useTwilioConfig();
  const configRef = useRef(twilioConfig);
  const {
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
    fetchPreviousMessagesFromTwilio,
    messageSent,
    setMessageSent,
  } = useConversationContext();

  const [phoneValid, setPhoneValid] = useState(false);
  const [mobileValid, setMobileValid] = useState(false);
  const [showNoNumberModal, setShowNoNumberModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(true);

  //fetch the entity data and Twilio Account Details on pageload
  useEffect(() => {
    ZOHO.embeddedApp.on("PageLoad", async function (data) {
      dispatchTwilioConfig({
        type: "SET_CONFIG",
        payload: {
          entity: data.Entity,
          entityId: data.EntityId,
        },
      });
      fetchAccountDetails();
    });
    ZOHO.embeddedApp.init().then(() => {});
  }, [configRef.current.entity, configRef.current.entityId]);

  
  // fetch client details when entity and entity id is available
  useEffect(() => {
    if (configRef.current.entity && configRef.current.entityId) {
      fetchClientDetails();
    }
  }, [configRef.current.entity, configRef.current.entityId]);

  useEffect(() => {
    if (
      configRef.current.currentTwilioNumber &&
      configRef.current.currentDefaultRecipientNumber
    ) {
      fetchChatConversationSid(
        configRef.current.currentDefaultRecipientNumber,
        configRef.current.currentTwilioNumber
      );
    }
  }, [
    configRef.current.currentDefaultRecipientNumber,
    configRef.current.currentTwilioNumber,
  ]);

  // fetch chat history
  useEffect(() => {
  if (
    twilioConfig.currentTwilioNumber &&
    twilioConfig.currentDefaultRecipientNumber &&
    twilioConfig.currentConversationSid
  ) {
    
    setMessages([]);
    fetchPreviousMessagesFromTwilio(true);
  }
}, [
  twilioConfig.currentDefaultRecipientNumber,
  twilioConfig.currentTwilioNumber,
  twilioConfig.currentConversationSid,
]);

  // looping to fetch messages after new message is sent
  useEffect(() => {
    
    if (!configRef.current.currentConversationSid || !messageSent) {
      return; // Don't proceed if sid is null or message wasn't sent
    }
    if (sidAtMessageSend.current !== configRef.current.currentConversationSid) {
      // console.log('conversation in config', configRef.current.currentConversationSid, 'conversation sid in message', sidAtMessageSend.current)
      console.log("Skipped interval because SID changed.");
      return;
    }

    setLoadingMessages(false);

    let isCancelled = false;
    let currentCount = 1;
    let timeouts = [];

    // fetchPreviousMessagesFromTwilio(true); // Initial fetch
    setRenderCount(1);

    const intervalTimes = [30000, 60000, 90000, 120000]; // 30s, 60s, 90s, 120s

    const executeFetch = () => {
      if (isCancelled || sidAtMessageSend.current !== configRef.current.currentConversationSid)
        return;

      if (currentCount < intervalTimes.length) {
        console.log(`executing fetch for ${currentCount} time`);
        fetchPreviousMessagesFromTwilio(true);
        setRenderCount(currentCount + 1);

        const timeoutId = setTimeout(
          executeFetch,
          intervalTimes[currentCount - 1]
        );
        timeouts.push(timeoutId);
        currentCount++;
      } else {
        setMessageSent(false);
      }
    };

    // Start the interval chain
    const initialTimeout = setTimeout(executeFetch, intervalTimes[0]);
    timeouts.push(initialTimeout);
    console.log("Interval start");

    // ❌ Cleanup on sid/messageSent change
    return () => {
      isCancelled = true;
      timeouts.forEach(clearTimeout); // Stop all timeouts
      console.log("⛔ Interval cleanup triggered due to sid/message change");
    };
  }, [messageSent, twilioConfig.currentDefaultRecipientNumber]);

  // Fix the scroll height of the chat container
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

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
  }, [configRef.current.currentConversationSid, messages]);

  useEffect(() => {
  configRef.current = twilioConfig;
}, [twilioConfig]);

  // const fetchAccountDetails = async () => {
  const fetchAccountDetails = async () => {
    try {
      setLoading(true);
      const {
        Success: { Content: currentTwilioNumber },
      } = await ZOHO.CRM.API.getOrgVariable(
        "testankitext__Current_Twilio_Number"
      );
      const { users } = await ZOHO.CRM.CONFIG.getCurrentUser();
      const userId = users[0].id;

      const response = await fetch(
        "https://mediauploader-764980215.development.catalystserverless.com/server/twilioHelper/get_configuration",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );

      const { success, data } = await response.json();

      if (!success || !data) {
        throw new Error("No Twilio config found.");
      }

      const {
        accountSid = "",
        authToken = "",
        messagingServiceSid = { friendlyName: "", Sid: "" },
        conversationServiceSid = { friendlyName: "", Sid: "" },
      } = data;

      dispatchTwilioConfig({
        type: "SET_CONFIG",
        payload: {
          userID: userId,
          twilioSID: accountSid,
          twilioToken: authToken,
          currentTwilioNumber,
          messagingServiceSid,
          conversationServiceSid,
        },
      });

      sidAtMessageSend.current = null;

      if (!currentTwilioNumber) setShowNoNumberModal(true);

      if (currentTwilioNumber) {
        const isValid = await validatePhoneNumber(currentTwilioNumber);
      }
    } catch (error) {
      console.error("Error getting Account Details:", error);
    } finally {
      setLoading(false);
    }
  };

  //Fetching the Record of Individual from ZOHO
  const fetchClientDetails = async () => {
    try {
      const { data } = await ZOHO.CRM.API.getRecord({
        Entity: configRef.current.entity,
        RecordID: configRef.current.entityId,
      });

      const entityData = data[0];

      const phone = entityData.Phone || "Number Needed";
      const mobile = entityData.Mobile || "Number Needed";

      dispatchTwilioConfig({
        type: "SET_CONFIG",
        payload: {
          receipientFullName: entityData.Full_Name,
          recipientPhone: phone,
          recipientMobile: mobile,
          currentDefaultRecipientNumber: mobile,
          entityData: entityData,
        },
      });

      const isPhoneValid =
        phone !== "Number Needed" ? await validatePhoneNumber(phone) : false;
      const isMobileValid =
        mobile !== "Number Needed" ? await validatePhoneNumber(mobile) : false;

      setPhoneValid(isPhoneValid);
      setMobileValid(isMobileValid);

      await fetchChatConversationSid(mobile, configRef.current.currentTwilioNumber);
    } catch (error) {
      console.error("Error fetching client details:", error);
    }
  };

  //Fetching Conversation SID from custom module
  const fetchChatConversationSid = async (recipientNumber, senderNumber) => {
    console.log('reciepint', recipientNumber, "sender", senderNumber)
    if (!recipientNumber || !senderNumber) {
      console.warn(
        `Missing ${!recipientNumber ? "recipient" : "sender"} number for SID.`
      );
      return null;
    }

    try {
      const response = await ZOHO.CRM.API.searchRecord({
        Entity: "testankitext__Conversation_Sid",
        Type: "criteria",
        Query: `((Name:equals:${recipientNumber})and(testankitext__From:equals:${senderNumber}))`,
      });


      if (response?.statusText === "nocontent") {
        setMessages([]);
        console.log('no content found in covesation sid')
        dispatchTwilioConfig({
          type: "SET_CONFIG",
          payload: { currentConversationSid: "" },
        });
        return null;
      }

      const matchFrom = response?.data?.[0]?.testankitext__From;
      if (matchFrom !== senderNumber) {
        console.log("Twilio 'From' mismatch.");
        setMessages([]);
        dispatchTwilioConfig({
          type: "SET_CONFIG",
          payload: { currentConversationSid: "" },
        });
        return null;
      }

      const recordID = response?.data?.[0]?.id;
      const conversationSid = response?.data?.[0]?.testankitext__Conversation_Sid;
      dispatchTwilioConfig({
        type: "SET_CONFIG",
        payload: { currentConversationSid: conversationSid, customModuleRecordId: recordID},
      });
    } catch (err) {
      console.error("Error fetching conversation SID:", err);
      dispatchTwilioConfig({
        type: "SET_CONFIG",
        payload: { currentConversationSid: "" },
      });
    }
  };

  // Verifying Receiver numbers
  const validatePhoneNumber = async (
    phoneNumber,
    userId = configRef.current.userID
  ) => {
    if (!userId) {
      console.error("User ID is missing in Twilio config.");
      return false;
    }

    if (!phoneNumber.startsWith("+")) {
      const typeLabel =
        phoneNumber === configRef.current.mobile ? "Mobile" : "Phone";
      toast.error(`${typeLabel} number must include a country code.`);
      return false;
    }

    const normalizedNumber = phoneNumber
      .replace(/\s+/g, "")
      .replace(/^\+{2,}/, "+");

    try {
      const { valid, reason, countryCode, lineType } =
        await validatePhoneNumberAPI(userId, normalizedNumber);

      if (valid) {
        console.log(
          `✅ Valid number. Country Code: ${countryCode}, Line Type: ${lineType}`
        );
        return true;
      } else {
        console.log(`⚠️ Invalid number: ${reason}`);
        return false;
      }
    } catch (err) {
      console.error("❌ Error validating phone number:", err);
      toast.error("Failed to validate phone number.");
      return false;
    }
  };

  // get full error details from Errors.json
  const getTwilioErrorMessage = (errorCode) => {
    const error = twilioErrors.find((err) => err.code === errorCode);
    if (error) {
      return {
        message: error.message,
        secondaryMessage: error.secondary_message,
      };
    }
    return null;
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

    const formatDate = (dateStr) => {
    const utcDate = new Date(dateStr);
    if (isNaN(utcDate)) return "Invalid Date"; // Fallback for unparseable dates

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const localDate = new Date(utcDate.getFullYear(), utcDate.getMonth(), utcDate.getDate());

    if (localDate.toDateString() === today.toDateString()) return "Today";
    if (localDate.toDateString() === yesterday.toDateString()) return "Yesterday";

    // Format safely using Intl
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(localDate)
      .replace(/ /g, "-");
  };

  // const formatDateForChat = (dateStr) => {
  //   const date = dayjs.utc(dateStr);
  //   const today = dayjs.utc();
  //   const yesterday = today.subtract(1, "day");

  //   if (date.isSame(today, "day")) return "Today";
  //   if (date.isSame(yesterday, "day")) return "Yesterday";
  //   return date.format("DD-MMM-YYYY");
  // };

  const formatTimeForChat = (dateStr) => {
    return dayjs.utc(dateStr).local().format("hh:mm A");
  };

  const formatMessage = (message) => {
    if (!message) return "";
    const formatted = message
      .replace("Sent from your Twilio trial account - ", "")
      .replace(/\r\n?/g, "\n")
    .replace(/\n/g, "<br>")
      .replace(/(https?:\/\/[^\s]+)/g, (url) => {
        return <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>;
      });

    return formatted;
  };

  const getMessageStatusIcon = (delivery) => {
    if(!delivery) return
    const {failed, undelivered, read, sent, delivered} = delivery
    if (
    failed === "none" &&
    undelivered === "none" &&
    read === "none" &&
    sent === "none" &&
    delivered === "none"
  ) {
    return <MdDone title="Sent" />;
  }
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

  const handleDefaultNumberChange = async (e) => {
    const newDefaultNumber = e.target.value;
    setMessages([]);
    sidAtMessageSend.current = "";
    dispatchTwilioConfig({
      type: "SET_CONFIG",
      payload: {
        currentDefaultRecipientNumber: newDefaultNumber,
        currentConversationSid: "",
        attachment: []
      },
    });
    await fetchChatConversationSid(
      newDefaultNumber, configRef.current.currentTwilioNumber
    );
  };

  // const handleSelectionChange = async(e) => {
  //   try {
  //     const selectedValue = e.target.value;
  //     if (!selectedValue) {
  //       toast.error("Invalid selection. Please choose a valid number.");
  //     }
  //     setCurrentConversationSid("");
  //      setMessages([])
  //     setcurrentTwilioNumber(selectedValue);
  //     await fetchChatConversationSid(defaultNumber, selectedValue)
  //   } catch (err) {
  //     console.error(err.message);
  //   }
  // };

  const handleRefershFeed = () => {
    if (
      !twilioConfig.currentConversationSid ||
      !twilioConfig.currentTwilioNumber
    ) {
      return;
    }
    setRefreshFeed(true);
    fetchPreviousMessagesFromTwilio(true);
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;

    // If user has scrolled to the top, fetch more messages
    if (
      chatContainerRef.current.scrollTop === 0 &&
      nextPageTokenRef.current !== null
    ) {
      fetchPreviousMessagesFromTwilio(false);
    }
  };

  const handleSettingsPage = () => {
    setShowSettings(true)
  }

  const handleSettingsClose = async () => {
    dispatchTwilioConfig({
      type: 'SET_CONFIG',
      payload:{
        twilioSid:'',
        twilioToken:'',
        currentConversationSid:'',
        currentTwilioNumber:'',
      }
    })
    fetchAccountDetails();
    await fetchClientDetails();
    setShowSettings(false)
  }

  return (
    <Box className="twilioChatContainer">
      {loading ? (
        <div className="skeletonLoader">
          <div className="skeletonHeader">
            <div className="receiverSkeleton">
              <Skeleton
                variant="rectangular"
                width={50}
                height={50}
                sx={{ borderRadius: "50%" }}
              />
              <Skeleton
                variant="rectangular"
                width={200}
                height={50}
                sx={{ borderRadius: "10px" }}
              />
              <Skeleton
                variant="rectangular"
                width={200}
                height={50}
                sx={{ borderRadius: "10px" }}
              />
            </div>
            <div className="clientSkeleton">
              <Skeleton
                variant="rectangular"
                width={200}
                height={50}
                sx={{ borderRadius: "10px" }}
              />
              <Skeleton
                variant="rectangular"
                width={50}
                height={50}
                sx={{ borderRadius: "50%" }}
              />
            </div>
          </div>
          <div className="chatSkeleton">
            <div className="sentSkeleton">
              <Skeleton
                variant="rectangular"
                width={300}
                height={50}
                sx={{ borderRadius: "10px", marginBottom: "10px" }}
              />
              <Skeleton
                variant="rectangular"
                width={150}
                height={50}
                sx={{ borderRadius: "10px", marginBottom: "10px" }}
              />
              <Skeleton
                variant="rectangular"
                width={200}
                height={60}
                sx={{ borderRadius: "10px", marginBottom: "10px" }}
              />
            </div>
            <div className="receiveSkeleton">
              <Skeleton
                variant="rectangular"
                width={250}
                height={100}
                sx={{ borderRadius: "10px", marginBottom: "10px" }}
              />
              <Skeleton
                variant="rectangular"
                width={400}
                height={50}
                sx={{ borderRadius: "10px" }}
              />
            </div>
          </div>
          <div className="inputSkeleton">
            <Skeleton
              variant="rectangular"
              width={50}
              height={50}
              sx={{ borderRadius: "50%" }}
            />
            <Skeleton
              variant="rectangular"
              width={50}
              height={50}
              sx={{ borderRadius: "50%" }}
            />
            <Skeleton
              variant="rectangular"
              width={550}
              height={50}
              sx={{ borderRadius: "10px" }}
            />
            <Skeleton
              variant="rectangular"
              width={50}
              height={50}
              sx={{ borderRadius: "50%" }}
            />
          </div>
        </div>
      ) : !twilioConfig.twilioSID || showSettings ? (
        <Settings close={handleSettingsClose} page={"chatComponent"}/>
      ) : (
        <>
          <Box className="chatHeader">
            <div className="chatLogo">
              <span>{configRef.current.receipientFullName.charAt([0])}</span>
            </div>
            <div className="detailsContainer">
              <div className="clientDetails">
                <span>{configRef.current.receipientFullName}</span>
                {configRef.current.mobile == "Number Needed" &&
                configRef.current.phone == "Number Needed" ? (
                  <span id="clientDetailsSpan">
                    Mobile/Phone number not present
                  </span>
                ) : (
                  <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={twilioConfig.currentDefaultRecipientNumber}
                    label="Number"
                    onChange={handleDefaultNumberChange}
                    disabled={loadingMessages}
                    sx={{
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                    }}
                  >
                    <MenuItem value={configRef.current.recipientPhone} disabled={!phoneValid}>
                      <span
                        className="menuItemOption"
                        style={{ opacity: phoneValid ? 1 : 0.5 }}
                      >
                        <span>Phone</span>
                        <span style={{ fontWeight: "300" }}>
                          {configRef.current.recipientPhone}
                        </span>
                        <span>
                          {!phoneValid && (
                            <FiAlertCircle
                              title="Invalid Number"
                              style={{ color: "red" }}
                            />
                          )}
                        </span>
                      </span>
                    </MenuItem>

                    <MenuItem
                      value={configRef.current.recipientMobile}
                      disabled={!mobileValid}
                    >
                      <span
                        id="mobilemenuItemOption"
                        style={{ opacity: mobileValid ? 1 : 0.5 }}
                      >
                        <span>Mobile</span>
                        <span style={{ fontWeight: "300" }}>
                          {" "}
                          {configRef.current.recipientMobile}
                        </span>
                        <span>
                          {!mobileValid && (
                            <FiAlertCircle
                              title="Invalid Number"
                              style={{ color: "red" }}
                            />
                          )}
                        </span>
                      </span>
                    </MenuItem>
                  </Select>
                )}
              </div>
              <div className="senderDetails">
                {configRef.current.currentTwilioNumber == null? (
                  <p>No numbers available.</p>
                ) : (
                  <div className="senderNumberContainer">
                    <span>Sender</span>
                    <span>{configRef.current.currentTwilioNumber}</span>
                  </div>
                )}
                <button className="settingsButton" onClick={handleSettingsPage}>
                  <PiGearSixFill />
                </button>
                <Tooltip title="Refresh">
                <button id="refreshButton" onClick={handleRefershFeed}>
                  {refreshFeed ? <img src={eclipse} alt="" /> : <TbReload />}
                </button>
                </Tooltip>
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
                  const isSent =
                    message.author === configRef.current.currentTwilioNumber ||
                    message.author === "system"
                      ? message.author
                      : null;

                  const showDateSeparator =
                    index === 0 ||
                    formatDate(messages[index - 1].dateCreated) !==
                      formatDate(message.dateCreated);

                  return (
                    <React.Fragment key={message.sid}>
                      {showDateSeparator && (
                        <Divider>
                          <div className="dateSeparator">
                            {formatDate(message.dateCreated)}
                          </div>
                        </Divider>
                      )}
                      <div
                        className={`message ${isSent ? "sent" : "received"}`}
                      >
                        <div className="messageContent">
                          {isSent && message.delivery == null && (
                            <Tooltip title="Twilio error">
                              <span className="leftErrorIcon">
                                <FiAlertCircle />
                              </span>
                            </Tooltip>
                          )}
                          <div
                            style={{ whiteSpace: "normal", fontSize: "15px" }}
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(
                                formatMessage(message.body)
                              ),
                            }}
                          />
                          {message.media && (
                            <MediaPlaceholder mediaSid={message.media[0].sid} />
                          )}
                          <div className="messageFooter">
                            <span className="time">
                              {formatTimeForChat(message.dateCreated)}
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
                      boxShadow:
                        "inset 2px 2px 9px 4px #ffff, inset -2px -2px 5px 2px #aaa6a !important",
                    },
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
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "15px",
                    }}
                  >
                    <p style={{ margin: "0px" }}>
                      Please choose a valid phone number before proceeding.
                    </p>
                    <p style={{ textAlign: "center", margin: "0px" }}>
                      If you need to set a default number, update your settings
                      in the SMS configuration panel.
                    </p>
                    <p style={{ margin: "0px" }}>
                      Need help? Contact support for assistance.
                    </p>
                  </DialogContent>
                  <DialogActions sx={{ justifyContent: "center" }}>
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
          <FooterComponent />
          <ToastContainer
            className="custom-toast-container"
            autoClose={3000}
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
