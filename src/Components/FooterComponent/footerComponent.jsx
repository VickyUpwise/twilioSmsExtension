import { Box, Modal } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import TextArea from "../TextComponent/textComponent";
import EmojiBox from "../EmojiComponent/emojiComponent";
import SendButton from "../SendButtonComponent/sendButton";
import TemplateComponent from "../TemplateComponent/templateComponent";
import MediaComponent from "../MediaComponent/mediaComponent";
import './footerComponent.scss'
import {useTwilioConfig} from "../../ContextApi/twilioConfigContext"


const FooterComponent = () => {
    const [activeSections, setActiveSections] = useState({
    template: false,
    media: false,
    emoji: false,
    });
    const { twilioConfig, dispatchTwilioConfig } = useTwilioConfig();
    const templateRef = useRef(null); // Ref for the current values of Config preventing null/previous values
    const emojiPickerRef = useRef(null);
    const textareaRef = useRef(null);
    const selectionRef = useRef({ start: 0, end: 0 });
    const messageInputRef = useRef(null);
      const mediaRef = useRef(null);
const textareaWrapperRef = useRef(null);
const sendButtonRef = useRef(null);
const caretRef = useRef({ start: 0, end: 0 });

  // Close the previous section if new section is opened
  useEffect(() => {
    const handleClickOutside = (event) => {

      if (event.target.closest(".Toastify__toast-container")) {
  return;
}
      // if inside emoji picker or button, keep emoji open
    if (
      emojiPickerRef.current?.contains(event.target)
    ) {
      return;
    }
      if (textareaWrapperRef.current?.contains(event.target)) {
      setActiveSections((prev) => ({
        ...prev,
        emoji: false,  // close emoji
        // keep prev.media and prev.template unchanged
      }));
      return;
    }
      if (
        // emojiPickerRef.current?.contains(event.target) ||
        templateRef.current?.contains(event.target) || mediaRef.current?.contains(event.target) || sendButtonRef.current?.contains(event.target)
      ) {
        return; // inside allowed section
      }
      setActiveSections({ template: false, media: false, emoji: false }); // close all
      dispatchTwilioConfig({
        type:'SET_CONFIG',
        payload:{
          attachment: []
        }
      })
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // close the section if warning message is shown
useEffect(() => {
    if (twilioConfig.showExistedConversationWarning) {
      setActiveSections({ template: false, media: false, emoji: false });
    }
  }, [twilioConfig.showExistedConversationWarning]);



//Close the section if default recipient number is changed
  useEffect(() => {
    setActiveSections({ template: false, media: false, emoji: false });
  }, [twilioConfig.currentDefaultRecipientNumber]);

    const handleActiveSection = (section) => {
    setActiveSections((prev) => ({
      ...prev,
      [section]: !prev[section], // toggle only this section
    }));
  };

    const handleShowTemplate = () => {
      dispatchTwilioConfig({
        type:'SET_CONFIG',
        payload:{
          attachment:[]
        }
      })
        handleActiveSection('template');
    };

    const handleMediaComponent = () => {
        handleActiveSection('media');
    };

    const saveCaret = (e) => {
      const { selectionStart, selectionEnd } = e.target;
    caretRef.current = { start: selectionStart, end: selectionEnd };
    };

    return(
        <Box className="chatInputContainer">
          {/* Template Component Button */}
            <button onClick={handleShowTemplate} className="emojiButton" >
              <svg width="25" height="25" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9.15002H11.25" stroke="#0087E0" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6 12.15H9.285" stroke="#0087E0" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7.5 4.5H10.5C12 4.5 12 3.75 12 3C12 1.5 11.25 1.5 10.5 1.5H7.5C6.75 1.5 6 1.5 6 3C6 4.5 6.75 4.5 7.5 4.5Z" stroke="#0087E0" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 3.01501C14.4975 3.15001 15.75 4.07251 15.75 7.50001V12C15.75 15 15 16.5 11.25 16.5H6.75C3 16.5 2.25 15 2.25 12V7.50001C2.25 4.08001 3.5025 3.15001 6 3.01501" stroke="#0087E0" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>

            {/* Template Section */}
            {activeSections.template && (
              <Modal
                open={activeSections.template}
                onClose={() =>
                  setActiveSections((prev) => ({ ...prev, template: false }))
                }
              >
              <div ref={templateRef}>
                <TemplateComponent
                  className="templateContainer"
                  showTemplate={activeSections.template}
                  setShowTemplateComponent={() => setActiveSections((prev) => ({ ...prev, template: false }))}
                  textareaRef={textareaRef}
                />
              </div>
              </Modal>
            )}

            {/* Media Component Button */}
            <button onClick={handleMediaComponent} className="emojiButton" disabled={twilioConfig.attachment.length > 0}>
              <svg width="25" height="25" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.53649 7.17525L6.61519 9.09651C5.55237 10.1593 5.55237 11.8898 6.61519 12.9527C7.67801 14.0155 9.40853 14.0155 10.4713 12.9527L13.4963 9.92771C15.622 7.80207 15.622 4.35471 13.4963 2.21545C11.3707 0.0898059 7.9233 0.0898059 5.78403 2.21545L2.48659 5.51289C0.66072 7.33876 0.66072 10.2956 2.48659 12.1215" stroke="#0087E0" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            {activeSections.media && (
                  <div ref={mediaRef} style={{position: 'relative', display: 'inline-block'}}>
                  <MediaComponent  className="mediaComponent" handleActiveSection={handleActiveSection}/>
                  </div>
            )}

            {/* Text Area with Emoji Button */}
            <div ref={textareaWrapperRef} className="textarea-container">
              {/* Text Area Comp0nent */}
              <TextArea textareaRef={textareaRef} selectionRef={selectionRef} messageInputRef={messageInputRef} caretRef={caretRef} saveCaret={(e) => saveCaret(e)}/>

              {/* Emoji Component */}
              <EmojiBox activeSection={activeSections} handleActiveSection={handleActiveSection} emojiPickerRef={emojiPickerRef} textareaRef={textareaRef} caretRef={caretRef} saveCaret={saveCaret}/>
            </div>

            {/* Send button component */}
            <div ref={sendButtonRef}>
          <SendButton closeSections={() => setActiveSections({ template: false, media: false, emoji: false })}/>
            </div>
        </Box>
    )
}

export default FooterComponent;