import { useTwilioConfig } from "../../ContextApi/twilioConfigContext";
import EmojiPicker from "emoji-picker-react";
import { useRef , useState, useEffect} from "react";

const EmojiBox = ({activeSection, handleActiveSection, emojiPickerRef, textareaRef, caretRef, saveCaret}) => {

    const { twilioConfig, dispatchTwilioConfig } = useTwilioConfig();

    //Add Emojis to 
  //   const handleEmojiClick = (emojiObject) => {
  //       dispatchTwilioConfig({
  //           type:'SET_CONFIG',
  //           payload:{
  //               newMessage: (twilioConfig.newMessage || "" )+ emojiObject.emoji,
  //           }
  //       })
  // };

  //  const handleEmojiClick = (emojiObject) => {
  //   const el = textareaRef.current;
  //   if (!el) return;

  //   const { start, end } = caretRef.current;
  //   const text = twilioConfig.newMessage || "";

  //   const newText = text.slice(0, start) + emojiObject.emoji + text.slice(end);

  //   dispatchTwilioConfig({
  //     type: "SET_CONFIG",
  //     payload: { newMessage: newText },
  //   });

  //   // put cursor after inserted emoji
  //   requestAnimationFrame(() => {
  //     el.focus();
  //     const pos = start + emojiObject.emoji.length;
  //     el.selectionStart = el.selectionEnd = pos;
  //     // update cached caret for the next insertion
  //     caretRef.current = { start: pos, end: pos };
  //   });
  // };
// EmojiBox.jsx
const handleEmojiClick = (emojiObject) => {
  const el = textareaRef.current;
  if (!el) return;

  // Prefer the live selection from the element; fallback to caretRef
  const start = Number.isInteger(el.selectionStart) ? el.selectionStart : caretRef.current.start;
  const end   = Number.isInteger(el.selectionEnd)   ? el.selectionEnd   : caretRef.current.end;

  // Use the live DOM value to avoid resurrecting deleted chars
  const text = el.value ?? (twilioConfig.newMessage || "");

  const newText = text.slice(0, start) + emojiObject.emoji + text.slice(end);

  dispatchTwilioConfig({
    type: "SET_CONFIG",
    payload: { newMessage: newText },
  });

  // Restore focus & caret after React commits
  setTimeout(() => {
    el.focus();
    const pos = start + emojiObject.emoji.length;
    el.setSelectionRange(pos, pos);
    caretRef.current = { start: pos, end: pos };
  }, 0);
};

  const handleShowEmojiPicker = (e) => {
    handleActiveSection('emoji');
  }
    return(
        <>
        <button onClick={handleShowEmojiPicker} onMouseDown={(e) => { e.preventDefault(); 
          saveCaret();}} style={{background: 'none', border:'none', cursor: 'pointer'}} ref={emojiPickerRef}>
            <svg width="25" height="25" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_83_10)">
            <path d="M9 0C13.9626 0 18 4.03738 18 9C18 13.9626 13.9626 18 9 18C4.03738 18 0 13.9626 0 9C0 4.03738 4.03738 0 9 0ZM9 16.875C13.3423 16.875 16.875 13.3423 16.875 9C16.875 4.65771 13.3423 1.125 9 1.125C4.65771 1.125 1.125 4.65771 1.125 9C1.125 13.3423 4.65771 16.875 9 16.875ZM13.4663 6.46692C13.4663 6.11727 13.3274 5.78194 13.0801 5.5347C12.8329 5.28746 12.4976 5.14856 12.1479 5.14856H12.1477C11.8869 5.14856 11.632 5.22588 11.4152 5.37075C11.1984 5.51561 11.0295 5.72151 10.9297 5.96241C10.8299 6.20331 10.8038 6.46838 10.8547 6.72412C10.9055 6.97986 11.0311 7.21477 11.2155 7.39914C11.3998 7.58352 11.6347 7.70908 11.8905 7.75995C12.1462 7.81082 12.4113 7.78471 12.6522 7.68493C12.8931 7.58514 13.099 7.41617 13.2439 7.19936C13.3887 6.98256 13.466 6.72767 13.466 6.46692H13.4663ZM7.17043 6.46692C7.17043 6.11727 7.03154 5.78194 6.7843 5.5347C6.53705 5.28746 6.20173 5.14856 5.85207 5.14856H5.85183C5.59108 5.14856 5.33619 5.22588 5.11939 5.37075C4.90258 5.51561 4.73361 5.72151 4.63382 5.96241C4.53404 6.20331 4.50793 6.46838 4.5588 6.72412C4.60967 6.97986 4.73523 7.21477 4.91961 7.39914C5.10398 7.58352 5.33889 7.70908 5.59463 7.75995C5.85037 7.81082 6.11544 7.78471 6.35634 7.68493C6.59724 7.58514 6.80314 7.41617 6.948 7.19936C7.09287 6.98256 7.17019 6.72767 7.17019 6.46692H7.17043ZM4.96213 10.5629H13.0379C13.1196 10.5629 13.2003 10.5807 13.2744 10.615C13.3485 10.6494 13.4143 10.6994 13.4671 10.7618C13.5199 10.8241 13.5585 10.8972 13.5802 10.9759C13.6019 11.0547 13.6062 11.1372 13.5928 11.2178C13.4104 12.304 12.8489 13.2905 12.0081 14.0019C11.1672 14.7133 10.1015 15.1037 9.00002 15.1037C7.89858 15.1037 6.83279 14.7133 5.99195 14.0019C5.1511 13.2905 4.58963 12.304 4.40726 11.2178C4.39384 11.1372 4.39812 11.0547 4.41983 10.9759C4.44153 10.8972 4.48013 10.8241 4.53294 10.7618C4.58574 10.6994 4.65149 10.6494 4.72561 10.615C4.79973 10.5807 4.88044 10.5629 4.96213 10.5629ZM9 13.979C9.71967 13.9814 10.4228 13.763 11.0145 13.3533C11.6061 12.9437 12.0579 12.3624 12.3089 11.6879H5.69109C5.94206 12.3624 6.39386 12.9437 6.98555 13.3533C7.57723 13.763 8.28033 13.9814 9 13.979Z" fill="#898989"/>
            </g>
            <defs>
            <clipPath id="clip0_83_10">
            <rect width="18" height="18" fill="white" transform="matrix(-1 0 0 1 18 0)"/>
            </clipPath>
            </defs>
            </svg> 
          </button>
          {activeSection.emoji && (
            <div className="emojiContianer" ref={emojiPickerRef} style={{position: "absolute",
        bottom: "117%",
        left: "30%",
        zIndex: "10",}}
        onMouseDown={(e) => e.preventDefault()}>
              <EmojiPicker
            onEmojiClick={handleEmojiClick}
            style={{ width: "430px", height: "315px"}}
        />
            </div>
          )}
          </>
    )
}

export default EmojiBox 