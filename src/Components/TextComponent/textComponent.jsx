import { useState, useEffect, useRef } from "react";
import { useTwilioConfig } from "../../ContextApi/twilioConfigContext";
import './text.scss'
const TextArea = ({textareaRef, caretRef, saveCaret}) => {

    const MAX_TWILIO_CHAR_LIMIT = 1600;
     const [showPopUp, setShowPopUp] = useState(false);
     
    
     const { twilioConfig, dispatchTwilioConfig } = useTwilioConfig();

    // show warning message when character limmit reach
      useEffect(() => {
        if(twilioConfig.twilioSid){
          if (twilioConfig.newMessage.length > 1600) {
            setShowPopUp(true); // Explicitly show the popup
          } else setShowPopUp(false);
          if (!twilioConfig.newMessage) {
            textareaRef.current.style.height = "25px"; // Reset height after sending message
          }
        }
      }, [twilioConfig.newMessage, textareaRef.current]);
     
      useEffect(() => {
  if (!textareaRef.current) return;

  if (twilioConfig.newMessage.length > MAX_TWILIO_CHAR_LIMIT) {
    setShowPopUp(true);
  } else {
    setShowPopUp(false);
  }

  // Reset height first
  textareaRef.current.style.height = "auto";

  // Set min height on empty, else auto-grow
  if (twilioConfig.newMessage.trim() === "") {
    textareaRef.current.style.height = "25px";
  } else {
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }
}, [twilioConfig.newMessage]);

// const normalizeNewlines = (s) =>
//   s
//     .replace(/\r\n?/g, "")   // CRLF/CR -> LF
//     .replace(/\n{2,}/g, "\n"); // clamp runs of 2+ to a single \

    const handleInputChange = (e) => {
        const value = e.target.value;

        //  const value = normalizeNewlines(raw); 

        const el = textareaRef.current;
        if (el) caretRef.current = { start: e.target.selectionStart, end: e.target.selectionEnd };

        if (value.length > MAX_TWILIO_CHAR_LIMIT) {
            setShowPopUp(true);
        } 
        else {
            setShowPopUp(false);
        }
        dispatchTwilioConfig({
            type: 'SET_CONFIG',
            payload:{
                newMessage: value,
            }
        })
        
        // Adjust textarea height dynamically
        textareaRef.current.style.height = "auto"; // Reset height
        if (value.trim() === "" || twilioConfig.newMessage.length === 0) {
        textareaRef.current.style.height = "25px"; // Ensure it resets to min height
        } else {
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Expand based on content
        }
    };

    


    return(
        <>
             <textarea
                ref={textareaRef}
                rows={1} // Default row height
                className={`message-input ${showPopUp ? "exceed-warning" : ""}`}
                value={twilioConfig.newMessage}
                onChange={(e) => handleInputChange(e)}
                onSelect={saveCaret} 
                onKeyUp={saveCaret}
                onClick={saveCaret}
                onFocus={saveCaret}
                placeholder="Type your message here..."
              />
              {showPopUp && (
                <div className="textarea-warning">
                  Character limit exceeded, message will be sent in segments.
                </div>
              )}
        </>
    )
}

export default TextArea;