import React, { useState, useEffect, useRef} from 'react';
import { Box } from '@mui/material';
import { IoIosSend } from "react-icons/io";
import { IoMdPerson } from "react-icons/io";
import { MdOutlineWatchLater } from "react-icons/md";
import { MdDone } from "react-icons/md";
import { IoCheckmarkDoneOutline } from "react-icons/io5";
import { toast, ToastContainer } from 'react-toastify';
import emptyChatLog from './utility/emptyChatLog.jpg'
import io from 'socket.io-client';
import axios from 'axios';
import './chatComponent.css'
import 'react-toastify/dist/ReactToastify.css';

const ChatComponent = () => {
    const [env, setEnv] = useState({
      entity: '',
      entityId: '',
      full_name:'',
      phone: '',
      twiliophone: '',
    });
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [buttonState, setButtonState] = useState('idle');
    const [accountSid, setAccountSid] = useState('')
    const [authToken, setAuthToken] = useState('')
    const chatContainerRef = useRef(null);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        ZOHO.embeddedApp.on("PageLoad", function(data){ //Fetching the Entity & Entity id for searching record.
          setEnv(prevEnv => ({
            ...prevEnv,
            entity: data.Entity,
            entityId: data.EntityId,
          }));
          fetchAccountSID();
          fetchAccountToken();
        });
        fetchClientDetails();
        ZOHO.embeddedApp.init().then(() => {});
    },[env.entityId, env.entity])

    useEffect(() => {
      if(env.phone){
        fetchTwilioPhoneNumber();
      }
    },[env.phone])

    useEffect(() => {
      if(env.twiliophone && env.phone){
        fetchPreviousMessagesFromTwilio();
      }
    }, [env.phone, env.twiliophone])

    useEffect(() => {
      let intervalId;
      if (env.twiliophone && env.phone) {
        fetchPreviousMessagesFromTwilio();
        // Poll for new messages every 30 seconds
        intervalId = setInterval(() => {
          fetchPreviousMessagesFromTwilio();
        }, 30000); // 30 seconds
      }
      return () => clearInterval(intervalId); // Clean up interval on component unmount
    }, [env.phone, env.twiliophone]);

    useEffect(() => {
      // Scroll to the bottom whenever messages are updated
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, [messages]); 

    const fetchAccountSID = async () => {
      try {
        const orgData = await ZOHO.CRM.API.getOrgVariable("twiliophonenumbervalidatorbyupro__Twilio_SID");
        const orgContent = orgData.Success.Content;
        if(orgContent === ''){
          setAccountSid('')
          toast.error('Account SID is empty.')
        }
        else{
          setAccountSid(orgContent)
        }
      } catch (error) {
        console.error("Error getting SID", error);
        toast.error('Something went wrong. Please try again')
      }
    };

    const fetchAccountToken = async () => {
      try {
        const orgData = await ZOHO.CRM.API.getOrgVariable("twiliophonenumbervalidatorbyupro__Twilio_Token");
        const orgContent = orgData.Success.Content;
        if(orgContent === ''){
          setAuthToken('')
          toast.error('Account token is empty.')
        }
        else{
          setAuthToken(orgContent)
        }
      } catch (error) {
        console.error("Error getting token", error);
        toast.error('Something went wrong. Please try again')
      }
    }
    
    //Fetching Phone number from Twilio
    const fetchTwilioPhoneNumber = async () => {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`;
    
      try {
        const response = await axios.get(url, {
          auth: {
            username: accountSid,
            password: authToken
          }
        });
        const phoneNumbers = response.data.incoming_phone_numbers;
        if (phoneNumbers.length > 0) {
          const twiliophone = phoneNumbers[0].phone_number;
          setEnv(prevEnv => ({
            ...prevEnv,
            twiliophone: twiliophone
          }))
        } else {
          toast.error('No Twilio phone numbers found')
        }
      } catch (error) {
        console.error('Error fetching Twilio phone number:', error);
      }
    };
    

    //Fetching the Record of Individual from ZOHO
    const fetchClientDetails = async() => {
      try {
        const recordData = await ZOHO.CRM.API.getRecord({ Entity: env.entity, RecordID: env.entityId });
        const entityData = recordData.data[0];
        setEnv(prevEnv => ({
          ...prevEnv,
          full_name: entityData.Full_Name,
          phone: entityData.Phone,
        }))
      }
      catch(error){
        console.log('error', error)
      }
    }


    // Fetch Message history of the user and entity
    const fetchPreviousMessagesFromTwilio = async () => {
      if (!env.phone.startsWith('+')) {
        toast.error('Phone number must include a country code.');
      } else {
        try {
          const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
          // Fetch inbound and outbound messages
          const [inboundResponse, outboundResponse] = await Promise.all([
            axios.get(url, {
              auth: { username: accountSid, password: authToken },
              params: { From: env.phone, To: env.twiliophone },
            }),
            axios.get(url, {
              auth: { username: accountSid, password: authToken },
              params: { From: env.twiliophone, To: env.phone },
            }),
          ]);
    
          const inboundMessages = inboundResponse.data.messages;
          const outboundMessages = outboundResponse.data.messages;
    
          // Combine inbound and outbound messages
          const allMessages = [...inboundMessages, ...outboundMessages];
    
          // Sort messages by both date and time
          allMessages.sort((a, b) => new Date(a.date_sent) - new Date(b.date_sent));
    
          setMessages(allMessages);
    
        } catch (error) {
          console.error('Error fetching messages from Twilio:', error);
          toast.error('Network Error, Chat history not loaded');
        }
      }
    };
    

    // Sending Message using twilio 
    const sendMessage = async () => {    
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
      const data = new URLSearchParams({
        Body: newMessage,                // Message content
        From: env.twiliophone,      // Your Twilio phone number
        To: env.phone      // Lead/Contact phone number
      });
    
      const auth = {
        username: accountSid,
        password: authToken
      };
    
      try {
        const response = await axios.post(url, data, {
          auth: auth,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        });
        setNewMessage('');
        fetchPreviousMessagesFromTwilio();
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ status: response.status });
          }, 5000);
        });
      } catch (error) {
        console.error('Error sending message:', error);
        if(error.response.data.message === 'Message body is required'){
          toast.error('Message can not be empty.')
        }
        else if(error.response.data.message.includes('unverified')) {
          toast.error('The number is unverified. Please verify it in Twilio.');
        }
        else{
          toast.error('Message not sent. Please try again later')
        }
      }
    };

    const formatDate = (dateStr) => {
      // Parse the UTC date from the server
      const date = new Date(dateStr);
    
      (dateStr);

  // Get the current date
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to midnight

  // Create a date object for yesterday
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1)
      
      // Convert the message date to local time for comparison
      const localDate = new Date(date.toLocaleString());
    
      // Check if the message date matches today's or yesterday's date
      if (localDate.toDateString() === today.toDateString()) return `Today`;
      if (localDate.toDateString() === yesterday.toDateString()) return `Yesterday`;
    
      // Format the date as '10-Oct-2024' if it's older
      const options = { day: '2-digit', month: 'short', year: 'numeric' };
      return `${localDate.toLocaleDateString('en-GB', options).replace(/ /g, '-')}`;
    };
      
    const formatMessage = (message) => {
      return message.replace('Sent from your Twilio trial account - ', '');
    };

    const getMessageStatusIcon = (status) => {
      switch (status) {
        case "queued":
        case "sending":
          return <MdOutlineWatchLater />;
        case "sent":
          return <MdDone />;
        case "delivered":
          return <IoCheckmarkDoneOutline />;
        default:
          return null;
      }
    };

    const handleInputChange = (e) => {
      setNewMessage(e.target.value);
    };

    const handleSendMessage = async () => {
      setButtonState('loading'); // Set button to loading state
  
      try {
        const response = await sendMessage();
        if (response.status === 201) {
          setButtonState('success');
        } else {
          setButtonState('error');
        }
      } catch (error) {
        setButtonState('error');
        
      }
      setTimeout(() => setButtonState('idle'), 5000);
    };

  return (
    <Box className='twilioChatContainer'>
      <Box className='chatHeader'>
        <div className='chatLogo'>
        <IoMdPerson />
        </div>
        <div className='clientDetails'>
          <span>{env.full_name}</span>
          <span>{env.phone}</span>
        </div>
      </Box>
      <Box className="chatContainer" ref={chatContainerRef}>
  {messages.length > 0 ? (
    messages.map((message, index) => {
      const isSent = message.from === env.twiliophone;
      const showDateSeparator = 
        index === 0 || 
        formatDate(messages[index - 1].date_sent) !== formatDate(message.date_sent);

      return (
        <React.Fragment key={message.sid}>
          {showDateSeparator && (
            <div className="dateSeparator">
              {formatDate(message.date_sent)}
            </div>
          )}
          <div className={`message ${isSent ? "sent" : "received"}`}>
            <div className="messageContent">
              <p style={{ fontSize: '15px' }}>{formatMessage(message.body)}</p>
              <div className="messageFooter">
                <span className="time">
                  {new Date(message.date_sent).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </span>
                {isSent && <span className="statusIcon">{getMessageStatusIcon(message.status)}</span>}
              </div>
            </div>
          </div>
        </React.Fragment>
      );
    })
  ) : (
    <div className='emptyContainer'>
      <p>No messages here yet......</p>
      <img src={emptyChatLog}/>
      <p>Send a message</p>
    </div>
  )}
</Box>
      <Box className='chatInputContainer'>
          <textarea
          className="message-input"
          value={newMessage}
          onChange={handleInputChange}
          placeholder="Type your message here..."
          />
          <button className={`button ${buttonState === 'loading' ? 'animate' : ''} ${buttonState === 'success' ? 'animate success' : ''} ${buttonState === 'error' ? 'animate error' : ''}`} 
            onClick={handleSendMessage} disabled={buttonState === 'loading'}>
            <IoIosSend/>
          </button>
      </Box>
      <ToastContainer/>
      <>
      {message && (
        <div style={styles.notification}>
          <strong>New Message from {message.from}:</strong> {message.body}
        </div>
      )}
    </>
    </Box>
  );
}

export default ChatComponent;
