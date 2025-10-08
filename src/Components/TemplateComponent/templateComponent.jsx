import React, { useEffect, useState, useRef } from "react";
import "./templateComponent.scss";
import { IoIosArrowDropleft, IoIosArrowDropright } from "react-icons/io";
import { RxCross2 } from "react-icons/rx";
import templateImage from "../../utility/template.jpeg";
import { IoAdd } from "react-icons/io5";
import { Tooltip } from "@mui/material";
import EmojiPicker from "emoji-picker-react";
import { fetchClientDetailsFromZoho } from "../../ContextApi/twilioConfigReducer";
import { useTwilioConfig } from "../../ContextApi/twilioConfigContext";
import DOMPurify from "dompurify";

const TemplateComponent = ({
  showTemplate,
  setShowTemplateComponent,
  textareaRef
}) => {
  // States
  const { twilioConfig, dispatchTwilioConfig } = useTwilioConfig();
  const [allTemplates, setAllTemplates] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [availableVariables, setAvailableVariables] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showVariableContainer, setShowVariableContainer] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [selection, setSelection] = useState(null);
  const editorRef = useRef(null);
  const lastRangeRef = useRef(null);
  const perPage = 3;
  const closeSvg = `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 11C8.75 11 11 8.75 11 6C11 3.25 8.75 1 6 1C3.25 1 1 3.25 1 6C1 8.75 3.25 11 6 11Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M4.58496 7.41496L7.41496 4.58496" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M7.41496 7.41496L4.58496 4.58496" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>

    `;

  // Fetch templates
  useEffect(() => {
    ZOHO.CRM.API.getAllRecords({
      Entity: "testankitext__SMS_Templates",
      sort_order: "asc",
      per_page: 200,
      page: 1,
    }).then((res) => (setAllTemplates(res.data || [])));
  }, [showTemplate]);

  // Fetch variable fields when button is clicked
  useEffect(() => {
    if (showSuggestions) {
      fetchClientDetailsFromZoho(twilioConfig.entity, twilioConfig.entityData).then(setAvailableVariables);
    }
  }, [showSuggestions, twilioConfig.entity]);

  // Load template into editor when modal opens
  useEffect(() => {
    if (modalVisible && editingTemplate?.testankitext__SMS_Content) {
      const decodeBase64 = (b64) => {
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array([...binary].map(char => char.charCodeAt(0)));
    return new TextDecoder().decode(bytes);
  } catch (err) {
    console.warn("Failed to decode base64:", b64);
    return b64; // fallback
  }
};

const rawEncoded = editingTemplate.testankitext__SMS_Content;
const decoded = decodeBase64(rawEncoded);

// replace variable tags with HTML span tags
const htmlContent = decoded.replace(/\$\{([\w.]+)\}/g, (_, varName) => {
  return `<span class="variable-tag" contenteditable="false" data-var="${varName}">${varName} </span>`;
});
{/* <span class="remove-tag">${closeSvg}</span> */}
editorRef.current.innerHTML = htmlContent;

    } else if (modalVisible && !isEditing) {
      editorRef.current.innerHTML = "";
    }
  }, [modalVisible, editingTemplate, isEditing]);

  const currentTemplates = allTemplates.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );
    

  const handleAddClick = () => {
    setIsEditing(false);
    setEditingTemplate({ Name: "", testankitext__SMS_Content: "" });
    setModalVisible(true);
  };

  const handleEditClick = (template) => {
    setIsEditing(true);
    setEditingTemplate(template);
    setModalVisible(true);
  };

  const handledeleteTemplate = async (id) => {
    await ZOHO.CRM.API.deleteRecord({
      Entity: "testankitext__SMS_Templates",
      RecordID: id,
    });
    const updated = allTemplates.filter((t) => t.id !== id);
    setAllTemplates(updated);
    if (currentPage > Math.ceil(updated.length / perPage))
      setCurrentPage((p) => p - 1);
  };

  const handlePageChange = (direction) => {
    const newPage = currentPage + direction;
    const totalPages = Math.ceil(allTemplates.length / perPage);
    if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage);
  };

const decodeBase64 = (b64) => {
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array([...binary].map((char) => char.charCodeAt(0)));
    return new TextDecoder().decode(bytes);
  } catch (err) {
    return b64; // fallback to raw if decoding fails
  }
};

const looksLikeBase64 = (str) => {
  return /^[A-Za-z0-9+/=]+$/.test(str) && str.length % 4 === 0;
};

const prettifyLabel = (label) => {
  return label
    .replace(/_/g, ' ')                     // First_Name → First Name
    .replace(/\./g, ' ')                    // Owner.name → Owner name
    .replace(/\b\w/g, char => char.toUpperCase()); // capitalize
};


// const renderTemplateWithTagsAsJSX = (encodedText) => {
//   const rawText = looksLikeBase64(encodedText) ? decodeBase64(encodedText) : encodedText;
//   console.log('raw text ', rawText)

//   const parts = rawText.split(/(\$\{[\w.]+\})/g); // Keep variable placeholders intact

//   return parts.map((part, index) => {
//     const match = part.match(/^\$\{([\w.]+)\}$/); // matches ${Owner.name}
//     if (match) {
//       const rawVar = match[1]; // Owner.name
//       return (
//         <span key={index} className="variable-tag-preview">
//           {prettifyLabel(rawVar)}
//         </span>
//       );
//     }

//     // Handle line breaks for plain text
//     return part.split("\n").map((line, i, arr) => (
//       <React.Fragment key={`${index}-${i}`}>
//         {line}
//         {/* {i !== arr.length - 1 && <br />} */}
//       </React.Fragment>
//     ));
//   });
// };

const renderTemplateWithTagsAsJSX = (encodedText) => {
  const rawText = looksLikeBase64(encodedText) ? decodeBase64(encodedText) : encodedText;
  console.log('raw text ', rawText);

  const lines = rawText.split("\n");

  return lines.flatMap((line, lineIndex) => {
    const parts = line.split(/(\$\{[\w.]+\})/g); // Split line into text and tags

    const renderedLine = parts.map((part, partIndex) => {
      const match = part.match(/^\$\{([\w.]+)\}$/);
      if (match) {
        const rawVar = match[1];
        return (
          <span key={`tag-${lineIndex}-${partIndex}`} className="variable-tag-preview">
            {prettifyLabel(rawVar)}
          </span>
        );
      }
      return <React.Fragment key={`text-${lineIndex}-${partIndex}`}>{part}</React.Fragment>;
    });

    return [
      ...renderedLine,
      lineIndex < lines.length - 1 ? <br key={`br-${lineIndex}`} /> : null,
    ];
  });
};


  const handleSaveTemplate = async () => {
    console.log('content', editorRef.current)
    normalizeBreaks(editorRef.current);
    const finalContent = extractText();
    if (!editingTemplate.Name || finalContent.length === 0) {
    return;
  }
    const APIData = {
      Name: editingTemplate.Name,
      testankitext__SMS_Content: finalContent,
    };

    if (isEditing) {
      APIData.id = editingTemplate.id;
      await ZOHO.CRM.API.updateRecord({
        Entity: "testankitext__SMS_Templates",
        APIData,
      });
    } else {
      await ZOHO.CRM.API.insertRecord({
        Entity: "testankitext__SMS_Templates",
        APIData,
      });
    }

    setModalVisible(false);
    ZOHO.CRM.API.getAllRecords({
      Entity: "testankitext__SMS_Templates",
      sort_order: "asc",
      per_page: 200,
      page: 1,
    }).then((res) => setAllTemplates(res.data || []));
  };

// const extractText = () => {
//   const walk = (node) => {
//     let content = "";

//     node.childNodes.forEach((child) => {
//       if (child.nodeType === 3) {
//         content += child.textContent;
//       } else if (child.dataset?.var) {
//         content += `\${${child.dataset.var}}`;
//       } else if (child.nodeName === "BR") {
//         content += "\n";
//       } else {
//         content += walk(child);
//         if (["DIV", "P"].includes(child.nodeName)) {
//           content += "\n"; // Preserve block-level breaks
//         }
//       }
//     });

//     return content;
//   };

//   const rawText = walk(editorRef.current);

//   const utf8Bytes = new TextEncoder().encode(rawText);
//   const binary = Array.from(utf8Bytes).map((b) => String.fromCharCode(b)).join("");
//   return btoa(binary);
// };

// const extractText = () => { 
//   const walk = (node) => { 
//     let content = ""; 
//     node.childNodes.forEach((child) => { 
//       if (child.nodeType === 3) { 
//         content += child.textContent; 
//       } 
//       else if (child.dataset?.var) { 
//         content += `\${${child.dataset.var}}`; 
//       } 
//       else if (child.nodeName === "BR") { 
//         content += "\n"; 
//       } 
//       else { content += walk(child); 
//         if (["DIV", "P"].includes(child.nodeName)) { 
//           content += "\n\n"; // Preserve block-level breaks 
//         } 
//       } 
//     }); 
//     return content; 
//   }; 
//   const rawText = walk(editorRef.current); 
//   const utf8Bytes = new TextEncoder().encode(rawText); 
//   const binary = Array.from(utf8Bytes).map((b) => String.fromCharCode(b)).join(""); 
//   return btoa(binary); 
// };
const extractText = () => {
  const isBlock = (el) => {
    if (!(el instanceof Element)) return false;
    return new Set([
      "DIV","P","LI","UL","OL","H1","H2","H3","H4","H5","H6",
      "SECTION","ARTICLE","ASIDE","HEADER","FOOTER","BLOCKQUOTE","PRE"
    ]).has(el.tagName);
  };

  const walk = (node) => {
    let out = "";

    node.childNodes.forEach((child) => {
      // Text node
      if (child.nodeType === Node.TEXT_NODE) {
        out += child.textContent;
        return;
      }

      // Explicit <br>
      if (child.nodeName === "BR") {
        out += "\n";
        return;
      }

      // Variable chip
      if (child instanceof Element && child.dataset?.var) {
        const parent = child.parentElement;
        const firstInParent = !child.previousSibling;
        if (parent && isBlock(parent) && firstInParent && !out.endsWith("\n")) {
          out += "\n";
        }
        out += `\${${child.dataset.var}}`;
        return;
      }

      // Preformatted blocks
      if (child.nodeName === "PRE" || child.nodeName === "TEXTAREA") {
        out += `\n${child.textContent}\n`;
        return;
      }

      // Other elements
      if (child instanceof Element) {
        const block = isBlock(child);

        // ✅ newline BEFORE a block if we're currently mid-line
        if (block && !out.endsWith("\n")) out += "\n";

        out += walk(child);

        // ✅ newline AFTER a block to close it
        if (block && !out.endsWith("\n")) out += "\n";
      } else {
        out += walk(child);
      }
    });

    return out;
  };

  const rawText =
    walk(editorRef.current)
      // Normalize newlines and collapse runs > 2
      .replace(/\r\n?/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  // Base64 encode (UTF-8 safe)
  const utf8Bytes = new TextEncoder().encode(rawText);
  const binary = Array.from(utf8Bytes, (b) => String.fromCharCode(b)).join("");
  return btoa(binary);
};

  const saveSelection = () => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  if (editorRef.current && editorRef.current.contains(range.startContainer)) {
    lastRangeRef.current = range.cloneRange();
  }
};

//   const restoreSelection = () => {
//   const sel = window.getSelection();
//   sel.removeAllRanges();
//   if (lastRangeRef.current) {
//     sel.addRange(lastRangeRef.current);
//   }
// };

//   const insertVariable = (variable) => {
//     if (!selection) {
//       editorRef.current.focus();
//       const sel = window.getSelection();
//       const range = document.createRange();
//       range.selectNodeContents(editorRef.current);
//       range.collapse(false);
//       sel.removeAllRanges();
//       sel.addRange(range);
//       setSelection(range);
//     }

//     restoreSelection();

//     const span = document.createElement("span");
//     span.className = "variable-tag";
//     span.contentEditable = "false";
//     span.setAttribute("data-var", variable);
//     span.innerHTML = `
//        <span class="var-text">${variable}</span>
//      `;
//     //  <span class="remove-tag" contenteditable="false">${closeSvg}</span>
//     const range = window.getSelection().getRangeAt(0);
//     range.insertNode(span);
//     range.collapse(false);
//     setShowSuggestions(false);
//   };

// Put caret at the end if we have no valid saved range
const placeCaretAtEnd = (root) => {
  const r = document.createRange();
  r.selectNodeContents(root);
  r.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
  lastRangeRef.current = r.cloneRange();
};

// Try to restore saved selection; return true if restored
const restoreSelection = () => {
  const saved = lastRangeRef.current;
  const root = editorRef.current;
  if (!saved || !root) return false;
  if (!root.contains(saved.startContainer) || !root.contains(saved.endContainer)) return false;
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(saved);
  return true;
};

// Remove duplicate <br> and normalize <div><br></div> blocks to a single <br>
const normalizeBreaks = (root) => {
  if (!root) return;

  // 1) Collapse consecutive <br> tags: <br><br>... -> <br>
  let changed = true;
  while (changed) {
    changed = false;
    // querySelectorAll('br + br') only returns the second in each adjacent pair
    const dupes = root.querySelectorAll('br + br');
    if (dupes.length) {
      dupes.forEach((br) => br.remove());
      changed = true;
    }
  }

  // 2) Convert empty block wrappers like <div><br></div> into a single <br>
  const divs = root.querySelectorAll('div');
  divs.forEach((div) => {
    if (
      div.childNodes &&
      div.childNodes.length === 1 &&
      div.firstChild.nodeName === 'BR'
    ) {
      const br = document.createElement('br');
      div.replaceWith(br);
    }
  });
};

// Insert a single <br> at the caret, then normalize
// const insertSingleBreak = (root) => {
//   const sel = window.getSelection();
//   if (!sel || sel.rangeCount === 0) return;

//   const range = sel.getRangeAt(0);
//   // Guard: ensure selection is inside the editor
//   if (!root.contains(range.startContainer)) return;

//   // Insert ONE <br> where the caret is
//   range.deleteContents();
//   const br = document.createElement('br');
//   range.insertNode(br);

//   // Move caret after the <br>
//   range.setStartAfter(br);
//   range.collapse(true);
//   sel.removeAllRanges();
//   sel.addRange(range);

//   // Cleanup any duplicates created by the browser normalization
//   normalizeBreaks(root);
// };

// Ensure the caret sits in an editable text node (creates a zero-width space if needed)
const ensureEditableCaret = () => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  let r = sel.getRangeAt(0);

  // If we're at an element boundary (common after non-editable spans), insert ZWSP
  if (r.startContainer.nodeType === Node.ELEMENT_NODE) {
    const textNode = document.createTextNode("\u200B");
    // place the text node at the caret position in the element
    const el = r.startContainer;
    const idx = Math.min(r.startOffset, el.childNodes.length);
    el.insertBefore(textNode, el.childNodes[idx] || null);

    r = document.createRange();
    r.setStart(textNode, 1); // caret after ZWSP
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
  }
};

// Insert a line break that works after text, emoji, and non-editable chips
const insertLineBreakSmart = (root) => {
  if (!root) return;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const r = sel.getRangeAt(0);
  if (!root.contains(r.startContainer)) return;

  // 1) Try the browser's native command (handles tricky boundaries well)
  if (document.queryCommandSupported?.("insertLineBreak")) {
    document.execCommand("insertLineBreak");
  } else {
    // 2) Fallback: manual <br> + ZWSP
    const br = document.createElement("br");
    r.insertNode(br);

    const spacer = document.createTextNode("\u200B");
    br.after(spacer);

    const after = document.createRange();
    after.setStart(spacer, 1);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
  }

  // Make sure we have a real, editable caret target
  ensureEditableCaret();

  // Clean any accidental duplicates
  normalizeBreaks(root);
};




// const insertVariable = (variable) => {
//   const root = editorRef.current;
//   if (!root) return;

//   // keep focus in editor
//   root.focus();

//   // restore or move to end
//   if (!restoreSelection()) {
//     placeCaretAtEnd(root);
//   }

//   const sel = window.getSelection();
//   if (!sel || sel.rangeCount === 0) return;
//   const range = sel.getRangeAt(0);

//   // build chip
//   const chip = document.createElement("span");
//   chip.className = "variable-tag";
//   chip.contentEditable = "false";
//   chip.setAttribute("data-var", variable);

//   const text = document.createElement("span");
//   text.className = "var-text";
//   text.textContent = variable;
//   chip.appendChild(text);

//   // insert chip at caret
//   range.deleteContents();
//   range.insertNode(chip);

//   // add a spacer so caret is in editable text after the chip
//   const spacer = document.createTextNode(" ");
//   range.setStartAfter(chip);
//   range.collapse(true);
//   range.insertNode(spacer);

//   // move caret after spacer, save it
//   const after = document.createRange();
//   after.setStartAfter(spacer);
//   after.collapse(true);
//   const sel2 = window.getSelection();
//   sel2.removeAllRanges();
//   sel2.addRange(after);
//   lastRangeRef.current = after.cloneRange();

//   setShowSuggestions(false);
// };

const insertVariable = (variable) => {
  const root = editorRef.current;
  if (!root) return;

  // Keep focus & try to restore saved caret
  root.focus();
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !root.contains(sel.getRangeAt(0).startContainer)) {
    // If we lost selection, put caret at the end (never start)
    const endRange = document.createRange();
    endRange.selectNodeContents(root);
    endRange.collapse(false);
    sel.removeAllRanges();
    sel.addRange(endRange);
  }

  const range = sel.getRangeAt(0);

  // Build the chip node
  const span = document.createElement('span');
  span.className = 'variable-tag';
  span.contentEditable = 'false';
  span.setAttribute('data-var', variable);

  const inner = document.createElement('span');
  inner.className = 'var-text';
  inner.textContent = variable;
  span.appendChild(inner);

  // Insert chip at caret (no <br> here)
  range.deleteContents();
  range.insertNode(span);

  // Place the caret in an editable spot after the chip
  const spacer = document.createTextNode(' ');
  range.setStartAfter(span);
  range.collapse(true);
  range.insertNode(spacer);

  // Move caret after spacer
  const after = document.createRange();
  after.setStartAfter(spacer);
  after.collapse(true);
  sel.removeAllRanges();
  sel.addRange(after);

  // 🔧 Normalize any duplicate <br> around the insertion
  normalizeBreaks(root);

  // Save selection for the next insert
  lastRangeRef.current = after.cloneRange();
  setShowSuggestions(false);
};


const insertEmoji = (emoji) => {
  const editor = editorRef.current;
  if (!editor) return;

  editor.focus();
  const sel = window.getSelection();

  // restore the last known range; if none, place at end
  let range = lastRangeRef.current;
  if (!range) {
    range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false); // end of content
  }

  // apply the range to the current selection
  sel.removeAllRanges();
  sel.addRange(range);

  // try the simple path first (works in most browsers)
  if (document.queryCommandSupported?.("insertText")) {
    document.execCommand("insertText", false, emoji);
  } else {
    // manual insert with Range API
    range.deleteContents();
    const node = document.createTextNode(emoji);
    range.insertNode(node);
    // move caret after the inserted emoji
    range.setStartAfter(node);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // keep our cached range fresh
  lastRangeRef.current = sel.getRangeAt(0);
};


  const handleCancelClick = () => {
      setShowTemplateComponent()
    }

  const handleShowEmojiContainer = () => {
    setShowEmoji(!showEmoji);
  };

  const handleVariableContainer = () => {
    setShowVariableContainer(!showVariableContainer);
    setShowSuggestions(!showSuggestions);
  };


const resolveTemplateVariables = async (templateText) => {
  const fields = await fetchClientDetailsFromZoho(twilioConfig.entity, twilioConfig.entityData);

  return templateText.replace(/\$\{([\w.]+)\}/g, (fullMatch, label, offset) => {
    const value = label.split('.').reduce((obj, key) => obj?.[key], twilioConfig.entityData);

    let resolvedValue = value != null ? value : `[${label}]`;

    // Add space if next character isn't punctuation or space
    const nextChar = templateText[offset + fullMatch.length] || "";
    if (!/[\s.,!?;:)\]}]/.test(nextChar)) {
      resolvedValue += " ";
    }
    return resolvedValue;
  });
};


  const handleTemplateContentChange = async (content) => {
    const safeContent = DOMPurify.sanitize(content); // escape tags or scripts
    const hasVariables = /\$\{(\w+)\}/.test(safeContent);
    const resolvedContent = await resolveTemplateVariables(safeContent);
  dispatchTwilioConfig({
    type: "SET_CONFIG",
      payload: {
        newMessage: resolvedContent,
      },
  })
  setShowTemplateComponent()
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"; // Reset height
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Expand based on content
      }
    }, 0);
  };

  return (
    <div className={modalVisible ? "modalContainer" : "templateContainer"}>
      {allTemplates.length === 0 && !modalVisible ? (
        <div className="templateInnerContainer">
          <img src={templateImage} alt="Template" />
          <p>Make your task easy by creating some templates.</p>
          <div className="templateActionButton">
            <Tooltip title="Add Template">
              <button className="teamplateAddButton" onClick={handleAddClick}>
                <IoAdd />
              </button>
            </Tooltip>
            <Tooltip title="Close">
              <button
                className="teamplateAddButton"
                onClick={handleCancelClick}
              >
                <RxCross2 />
              </button>
            </Tooltip>
          </div>
        </div>
      ) : (
        !modalVisible && (
          <div className="templateInnerContainer">
            <div className="templateActionButton">
              <span>Templates</span>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "70px",
                }}
              >
                <button className="teamplateAddButton" onClick={handleAddClick}>
                  <IoAdd />
                </button>
                <button
                  className="teamplateAddButton"
                  onClick={handleCancelClick}
                >
                  <RxCross2 />
                </button>
              </div>
            </div>
            <div className="pagination">
              <button
                onClick={() => handlePageChange(-1)}
                className="teamplatePreviousButton"
                disabled={currentPage === 1}
                style={{ left: "0rem" }}
              >
                <IoIosArrowDropleft />
              </button>
              {currentTemplates.map((template) => (
                <div key={template.id} className="template">
                  <div className="templateHeader">{template.Name}</div>
                  <div className="templateContent" style={{ whiteSpace: "pre-wrap" , wordBreak: "break-word"}}>
                    {renderTemplateWithTagsAsJSX(
                      template.testankitext__SMS_Content
                    )}
                  </div>
                  <div className="templateActions">
                    <Tooltip title="Select">
                      <button
                        onClick={() =>
                          handleTemplateContentChange(
                            looksLikeBase64(template.testankitext__SMS_Content)
  ? decodeBase64(template.testankitext__SMS_Content)
  : template.testankitext__SMS_Content)
                        }
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 14 10"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1 5L4.99529 9L13 1"
                            stroke="#0087E0"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <button onClick={() => handleEditClick(template)}>
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 13 13"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7.18264 1.94997L2.73556 6.65706C2.56764 6.83581 2.40514 7.18789 2.37264 7.43164L2.17223 9.18664C2.10181 9.82039 2.55681 10.2537 3.18514 10.1454L4.92931 9.84748C5.17306 9.80414 5.51431 9.62539 5.68223 9.44123L10.1293 4.73414C10.8985 3.92164 11.2451 2.99539 10.0481 1.86331C8.85639 0.742058 7.95181 1.13747 7.18264 1.94997Z"
                            stroke="#292D32"
                            stroke-miterlimit="10"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M6.44043 2.73541C6.67335 4.23041 7.88668 5.37333 9.39251 5.525"
                            stroke="#292D32"
                            stroke-miterlimit="10"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M1.625 11.9167H11.375"
                            stroke="#292D32"
                            stroke-miterlimit="10"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <button onClick={() => handledeleteTemplate(template.id)}>
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M13.7812 4.17438C11.5959 3.95781 9.3975 3.84625 7.20562 3.84625C5.90625 3.84625 4.60687 3.91188 3.3075 4.04313L1.96875 4.17438"
                            stroke="#F00000"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M5.57812 3.51156L5.7225 2.65187C5.8275 2.02844 5.90625 1.5625 7.01531 1.5625H8.73469C9.84375 1.5625 9.92906 2.05469 10.0275 2.65844L10.1719 3.51156"
                            stroke="#F00000"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M12.3705 6.24817L11.9439 12.8566C11.8718 13.8869 11.8127 14.6875 9.98176 14.6875H5.76863C3.9377 14.6875 3.87863 13.8869 3.80645 12.8566L3.37988 6.24817"
                            stroke="#F00000"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M6.77881 11.0781H8.96412"
                            stroke="#F00000"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M6.23438 8.45312H9.51562"
                            stroke="#F00000"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>
                    </Tooltip>
                  </div>
                </div>
              ))}

              <button
                onClick={() => handlePageChange(1)}
                className="teamplatePreviousButton"
                disabled={
                  currentPage === Math.ceil(allTemplates.length / perPage)
                }
                style={{ right: "0rem" }}
              >
                <IoIosArrowDropright />
              </button>
            </div>
          </div>
        )
      )}
      {modalVisible && (
        <div className="modal">
          <div className="modalContent">
            <div className="modalHeader">
              {isEditing ? "Edit Template" : "Add Template"}
            </div>
            <div className="modalfield">
              <span>Template Name</span>
              <input
                type="text"
                placeholder="Enter Name"
                value={editingTemplate?.Name || ""}
                onChange={(e) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    Name: e.target.value,
                  })
                }
              />
            </div>
            <div className="modalfield">
              <span>Template Content</span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                <div
                  className="editor"
                  contentEditable
                  ref={editorRef}
                  
                  onInput={saveSelection}
                  onMouseUp={saveSelection}
                  onKeyUp={saveSelection}
                  onKeyDown={(e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    insertLineBreakSmart(editorRef.current);
    saveSelection();
  }
}}
                  placeholder="Type your message..."
                />
                <div className="inputFieldActionButtons">
                  <button
                  onMouseDown={(e) => e.preventDefault()}
                    onClick={handleVariableContainer}
                    style={{ background: "none", border: "none" }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.66667 8.33325L5 9.99992L6.66667 11.6666"
                        stroke="#898989"
                        stroke-width="1.2"
                        stroke-miterlimit="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M13.3333 8.33325L14.9999 9.99992L13.3333 11.6666"
                        stroke="#898989"
                        stroke-width="1.2"
                        stroke-miterlimit="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M10.0001 18.3334C14.6025 18.3334 18.3334 14.6025 18.3334 10.0001C18.3334 5.39771 14.6025 1.66675 10.0001 1.66675C5.39771 1.66675 1.66675 5.39771 1.66675 10.0001C1.66675 14.6025 5.39771 18.3334 10.0001 18.3334Z"
                        stroke="#898989"
                        stroke-width="1.2"
                        stroke-miterlimit="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M10.8334 8.05835L9.16675 11.9417"
                        stroke="#898989"
                        stroke-width="1.2"
                        stroke-miterlimit="10"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleShowEmojiContainer}
                    style={{ background: "none", border: "none" }}
                  >
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clip-path="url(#clip0_83_10)">
                        <path
                          d="M9 0C13.9626 0 18 4.03738 18 9C18 13.9626 13.9626 18 9 18C4.03738 18 0 13.9626 0 9C0 4.03738 4.03738 0 9 0ZM9 16.875C13.3423 16.875 16.875 13.3423 16.875 9C16.875 4.65771 13.3423 1.125 9 1.125C4.65771 1.125 1.125 4.65771 1.125 9C1.125 13.3423 4.65771 16.875 9 16.875ZM13.4663 6.46692C13.4663 6.11727 13.3274 5.78194 13.0801 5.5347C12.8329 5.28746 12.4976 5.14856 12.1479 5.14856H12.1477C11.8869 5.14856 11.632 5.22588 11.4152 5.37075C11.1984 5.51561 11.0295 5.72151 10.9297 5.96241C10.8299 6.20331 10.8038 6.46838 10.8547 6.72412C10.9055 6.97986 11.0311 7.21477 11.2155 7.39914C11.3998 7.58352 11.6347 7.70908 11.8905 7.75995C12.1462 7.81082 12.4113 7.78471 12.6522 7.68493C12.8931 7.58514 13.099 7.41617 13.2439 7.19936C13.3887 6.98256 13.466 6.72767 13.466 6.46692H13.4663ZM7.17043 6.46692C7.17043 6.11727 7.03154 5.78194 6.7843 5.5347C6.53705 5.28746 6.20173 5.14856 5.85207 5.14856H5.85183C5.59108 5.14856 5.33619 5.22588 5.11939 5.37075C4.90258 5.51561 4.73361 5.72151 4.63382 5.96241C4.53404 6.20331 4.50793 6.46838 4.5588 6.72412C4.60967 6.97986 4.73523 7.21477 4.91961 7.39914C5.10398 7.58352 5.33889 7.70908 5.59463 7.75995C5.85037 7.81082 6.11544 7.78471 6.35634 7.68493C6.59724 7.58514 6.80314 7.41617 6.948 7.19936C7.09287 6.98256 7.17019 6.72767 7.17019 6.46692H7.17043ZM4.96213 10.5629H13.0379C13.1196 10.5629 13.2003 10.5807 13.2744 10.615C13.3485 10.6494 13.4143 10.6994 13.4671 10.7618C13.5199 10.8241 13.5585 10.8972 13.5802 10.9759C13.6019 11.0547 13.6062 11.1372 13.5928 11.2178C13.4104 12.304 12.8489 13.2905 12.0081 14.0019C11.1672 14.7133 10.1015 15.1037 9.00002 15.1037C7.89858 15.1037 6.83279 14.7133 5.99195 14.0019C5.1511 13.2905 4.58963 12.304 4.40726 11.2178C4.39384 11.1372 4.39812 11.0547 4.41983 10.9759C4.44153 10.8972 4.48013 10.8241 4.53294 10.7618C4.58574 10.6994 4.65149 10.6494 4.72561 10.615C4.79973 10.5807 4.88044 10.5629 4.96213 10.5629ZM9 13.979C9.71967 13.9814 10.4228 13.763 11.0145 13.3533C11.6061 12.9437 12.0579 12.3624 12.3089 11.6879H5.69109C5.94206 12.3624 6.39386 12.9437 6.98555 13.3533C7.57723 13.763 8.28033 13.9814 9 13.979Z"
                          fill="#898989"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_83_10">
                          <rect
                            width="18"
                            height="18"
                            fill="white"
                            transform="matrix(-1 0 0 1 18 0)"
                          />
                        </clipPath>
                      </defs>
                    </svg>
                  </button>
                  {showEmoji && (
                    <EmojiPicker
                      onEmojiClick={(e) => insertEmoji(e.emoji)}
                      emojiStyle="apple"
                      className="emojiPicker"
                      skinTonePickerLocation="PREVIEW"
                      width={246}
                      height={411}
                      style={{ position: "absolute", borderRadius: "4px" }}
                    />
                  )}
                </div>
              </div>
              {showSuggestions && (
                <div className="variableSuggestions" onMouseDown={(e) => e.preventDefault()}>
                  {availableVariables.map((item, idx) => (
                    <div
                      key={idx}
                      className="variableOption"
                      onClick={() => insertVariable(item.value)}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="saveButtonContainer">
              <button
                className="modalActionButton"
                onClick={handleSaveTemplate}
              >
                Save
              </button>
              <button
                className="modalActionButton"
                onClick={() => setModalVisible(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    // <div className="template-wrapper">
    //   {!modalVisible && (
    //     <div className="template-list">
    //       <button onClick={handleAddClick}>Add Template</button>
    //       {currentTemplates.map((template) => (
    //         <div key={template.id} className="template">
    //           <div>{template.Name}</div>
    //           <div>{template.testankitext__SMS_Content}</div>
    //           <button onClick={() => handleEditClick(template)}>Edit</button>
    //           <button onClick={() => deleteTemplate(template.id)}>Delete</button>
    //         </div>
    //       ))}
    //       <div className="pagination">
    //         <button onClick={() => handlePageChange(-1)} disabled={currentPage === 1}>Prev</button>
    //         <button onClick={() => handlePageChange(1)} disabled={currentPage === Math.ceil(allTemplates.length / perPage)}>Next</button>
    //       </div>
    //     </div>
    //   )}

    //   {modalVisible && (
    //     <div className="template-modal">
    //       <input
    //         type="text"
    //         value={editingTemplate?.Name || ''}
    //         onChange={(e) => setEditingTemplate({ ...editingTemplate, Name: e.target.value })}
    //         placeholder="Template Name"
    //       />
    //       <div
    //         className="editor"
    //         contentEditable
    //         ref={editorRef}
    //         onClick={saveSelection}
    //         onBlur={saveSelection}
    //         onInput={saveSelection}
    //         onMouseUp={saveSelection}
    //         onKeyUp={saveSelection}
    //       ></div>
    //       <div className="editor-actions">
    //         <button onClick={() => setShowSuggestions(true)}>Insert Variable</button>
    //         <button onClick={() => setShowEmoji((prev) => !prev)}>😊 Emoji</button>
    //       </div>
    //       {showSuggestions && (
    //         <div className="variable-suggestions">
    //           {availableVariables.map((item, idx) => (
    //             <div key={idx} onClick={() => insertVariable(item.value)}>{item.label}</div>
    //           ))}
    //           <div onClick={() => setShowSuggestions(false)}>Cancel</div>
    //         </div>
    //       )}
    //       {showEmoji && (
    //         <div className="emoji-picker-container">
    //           <EmojiPicker onEmojiClick={(e) => insertEmoji(e.emoji)} />
    //         </div>
    //       )}
    //       <div className="modal-actions">
    //         <button onClick={handleSaveTemplate}>Save</button>
    //         <button onClick={() => setModalVisible(false)}>Cancel</button>
    //       </div>
    //     </div>
    //   )}
    // </div>
  );

  // const [allTemplates, setAllTemplates] = useState([]); // List of templates
  // const [currentPage, setCurrentPage] = useState(1); // Current page
  // const [editingTemplateId, setEditingTemplateId] = useState(null); // ID of the template being edited
  // const [newTemplate, setNewTemplate] = useState({ Name: "", testankitext__SMS_Content: "" }); // New template state
  // const [error, setError] = useState(""); // Error handling
  // const [addNew, setAddNew] = useState(false);
  // const perPage = 3; // Number of records per page

  // useEffect(() => {
  //   fetchAllRecords(); // Fetch records for the first page
  // }, [showTemplate]);

  // const fetchAllRecords = async () => {
  //   try {
  //     const response = await ZOHO.CRM.API.getAllRecords({
  //       Entity: 'testankitext__SMS_Templates',
  //       sort_order: 'asc',
  //       per_page: 200,
  //       page: 1,
  //     });
  //     setAllTemplates(response.data || []); // Update templates
  //   } catch (error) {
  //     console.error('Error fetching records:', error);
  //   }
  // };

  // // Handle pagination
  // const handlePageChange = (direction) => {
  //   const newPage = currentPage + direction;
  //   const totalPages = Math.ceil(allTemplates.length / perPage);
  //   if (newPage > 0 && newPage <= totalPages) {
  //     setCurrentPage(newPage); // Update the current page
  //   }
  // };

  // // Function to delete a template
  // const deleteTemplate = async (id) => {
  //   try {
  //     await ZOHO.CRM.API.deleteRecord({
  //       Entity: 'testankitext__SMS_Templates',
  //       RecordID: id,
  //     });
  //     setAllTemplates(allTemplates.filter(template => template.id !== id)); // Update list
  //   } catch (error) {
  //     console.error('Error deleting template:', error);
  //   }
  // };

  // // Handle edit click
  // const handleEditClick = (templateId) => {
  //   setEditingTemplateId(templateId);
  // };

  // // Save template (edit existing)
  // const handleSaveEdit = async (templateId) => {
  //   const template = allTemplates.find(t => t.id === templateId);
  //   if (!template?.Name || !template?.testankitext__SMS_Content) {
  //     setError("Both title and content are required.");
  //     return;
  //   }

  //   try {
  //     await ZOHO.CRM.API.updateRecord({
  //       Entity: 'testankitext__SMS_Templates',
  //       APIData: {
  //         id: template.id,
  //         Name: template.Name,
  //         testankitext__SMS_Content: template.testankitext__SMS_Content,
  //       },
  //     });
  //     setEditingTemplateId(null);
  //     setError("");
  //   } catch (error) {
  //     console.error('Error saving template:', error);
  //   }
  // };

  // // Handle adding a new template
  // const handleAddNewTemplate = async () => {
  //   if (!newTemplate.Name || !newTemplate.testankitext__SMS_Content) {
  //     setError("Both title and content are required.");
  //     return;
  //   }

  //   try {
  //     const response = await ZOHO.CRM.API.insertRecord({
  //       Entity: 'testankitext__SMS_Templates',
  //       APIData: newTemplate,
  //     });

  //     if (response.data) {
  //       setAllTemplates([...allTemplates, response.data]);
  //     }

  //     setNewTemplate({ Name: "", testankitext__SMS_Content: "" });
  //     setError("");
  //   } catch (error) {
  //     console.error('Error adding template:', error);
  //   }
  // };
  // const handleAddClick = () => {
  //   setAddNew(true)
  // }

  // const handleCancelClick = () => {
  //      setShowTemplateComponent(false)
  //   }

  // return (
  //   <div className='templateContainer'>
  //     {allTemplates.length === 0 ? (
  //       <div className="templateInnerContainer">
  //         <p>Make your task easy by creating some templates.</p>
  //       </div>
  //     ) : (
  //       <div className="templateInnerContainer">
  //         <div className="pagination">
  //           <button
  //             onClick={() => handlePageChange(-1)}
  //             className="teamplatePreviousButton"
  //             disabled={currentPage === 1}
  //           >
  //             <IoIosArrowDropleft />
  //           </button>

  //           {allTemplates.slice((currentPage - 1) * perPage, currentPage * perPage).map((template) => (
  //             {
  //               addNew && (
  //                 <div className="newTemplate">
  //         <input
  //           type="text"
  //           value={newTemplate.Name}
  //           onChange={(e) => setNewTemplate({ ...newTemplate, Name: e.target.value })}
  //           placeholder="New Template Name"
  //         />
  //         <textarea
  //           value={newTemplate.testankitext__SMS_Content}
  //           onChange={(e) => setNewTemplate({ ...newTemplate, testankitext__SMS_Content: e.target.value })}
  //           placeholder="Type new template content..."
  //         />
  //         <div className="newTemplateActionButton">
  //         <button className="addButton" onClick={handleAddNewTemplate}>
  //           <MdOutlineDone />
  //         </button>
  //         <button className="addButton" onClick={() => setAddNew(false)}>
  //         <RxCross2 />
  //         </button>
  //         </div>

  //       </div>
  //               )
  //             }
  //             <div key={template.id} className="template">
  //               {editingTemplateId === template.id ? (
  //                 <>
  //                   <input
  //                     type="text"
  //                     value={template.Name}
  //                     onChange={(e) =>
  //                       setAllTemplates(allTemplates.map(t => t.id === template.id ? { ...t, Name: e.target.value } : t))
  //                     }
  //                     placeholder="Template Name"
  //                   />
  //                   <textarea
  //                     value={template.testankitext__SMS_Content}
  //                     onChange={(e) =>
  //                       setAllTemplates(allTemplates.map(t => t.id === template.id ? { ...t, testankitext__SMS_Content: e.target.value } : t))
  //                     }
  //                     placeholder="Type your content here..."
  //                   />
  //                   <div className="templateActions">
  //                     <button onClick={() => handleSaveEdit(template.id)}>
  //                       <MdOutlineDone />
  //                     </button>
  //                     <button onClick={() => setEditingTemplateId(null)}>
  //                       <RxCross2 />
  //                     </button>
  //                   </div>
  //                 </>
  //               ) : (
  //                 <>
  //                   <div className="templateHeader">
  //                     <h5>{template.Name}</h5>
  //                     <div className="templateActions">
  //                       <button onClick={() => handleTemplateContentChange(template.testankitext__SMS_Content)}>
  //                         <MdOutlineDone />
  //                       </button>
  //                       <button onClick={() => handleEditClick(template.id)}>
  //                         <LuPencil />
  //                       </button>
  //                       <button onClick={() => deleteTemplate(template.id)}>
  //                         <RiDeleteBin6Line />
  //                       </button>
  //                     </div>
  //                   </div>
  //                   <div className="templateContent">{template.testankitext__SMS_Content}</div>
  //                 </>
  //               )}
  //             </div>
  //           ))}

  //           <button
  //             onClick={() => handlePageChange(1)}
  //             className="teamplatePreviousButton"
  //             disabled={currentPage === Math.ceil(allTemplates.length / perPage)}
  //           >
  //             <IoIosArrowDropright />
  //           </button>
  //         </div>
  //         <div className="templateActionButton">
  //            <button
  //              className="teamplateAddButton"
  //              style={{ transform: 'rotate(45deg)' }}
  //              onClick={handleAddClick}
  //            >
  //              <RxCross2 />
  //            </button>
  //            <button
  //              className="teamplateAddButton"
  //              onClick={handleCancelClick}
  //            >
  //              <RxCross2 />
  //            </button>
  //          </div>
  //       </div>
  //     )}
  //   </div>
  //);
};

export default TemplateComponent;
