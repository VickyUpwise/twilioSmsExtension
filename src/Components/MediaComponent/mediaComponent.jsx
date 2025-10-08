import React, { useRef, useState, useEffect} from "react";
import "./mediaComponent.scss";
import { Box} from "@mui/material";
import { CameraAlt, Description, PhotoLibrary, Audiotrack} from "@mui/icons-material";
import { toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FilePreview from "../MediaPreview/mediaPreview";
import CustomWebcam from "../../utility/WebCam/webCam";
import { TiCamera } from "react-icons/ti";
import { HiDocumentText } from "react-icons/hi2";
import { BsImage } from "react-icons/bs";
import {Modal} from "@mui/material";
import DOMPurify from "dompurify";
import { IoMusicalNote } from "react-icons/io5";
import {useTwilioConfig} from "../../ContextApi/twilioConfigContext"
import {showToast} from '../../utility/toast'
import { ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MediaComponent = ({mediaComponent, handleActiveSection}) => {
  const { twilioConfig, dispatchTwilioConfig } = useTwilioConfig();
  const twilioConfiRef = useRef(twilioConfig);
  const [showOptions, setShowOptions] = useState(true);
  const [showWebcam, setShowWebcam] = useState(false);
  const [active, setActive] = useState(0);
  const [showIndicator, setShowIndicator] = useState(false);
  const [fileCategory, setFileCategory] = useState(null); // ✅ Tracks file category
  const [openModal, setOpenModal] = useState(false);
const menuRef = useRef(null);

  useEffect(() => {
    twilioConfiRef.current = twilioConfig;
    
  }, [twilioConfig]);
  const MAX_FILES = 7;

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowOptions(false);
        
      }
    }

    if (showOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptions, setShowOptions]);

  // ✅ Allowed MIME Types and Size Limits
  const allowedMimeTypes = {
    // media: ["image/jpeg", "image/png", "image/gif"],
    media: [
      "image/jpeg", 
      "image/jpg", 
      "image/png", 
      "image/gif", 
      "video/mp4",
      "video/webm", ],
    document: [
      "application/pdf",
      "application/vcard",
      "text/vcard",
      "text/x-vcard",
      "text/csv",
      "text/calendar",
      // "application/msword",
      // "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      // "application/vnd.ms-excel",
      // "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // "application/vnd.ms-powerpoint",
      // "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ],
    audio: [
      "audio/mp3",
      "audio/mpeg",
      "audio/ogg",
      "audio/wav",]
  };
  const maxFileSize = 600 * 1024; // ✅ 600KB file size limit

  // ✅ File Validation & Adding to Array
  const handleFileSelection = (files, category) => {
  const list = Array.from(files || []);
  if (!list.length) return;

  // ensure ref exists
  if (!twilioConfiRef.current) twilioConfiRef.current = { attachment: [] };

  // block mixed categories
  if (fileCategory && fileCategory !== category) {
    toast.error("You can only upload one type of file at a time.");
    return;
  }

  const extensionMimeMapping = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    mp4: "video/mp4",
    webm: "video/webm",
    mp3: "audio/mp3",
    mpeg: "audio/mpeg",
    ogg: "audio/ogg",
    wav: "audio/wav",
    pdf: "application/pdf",
    csv: "text/csv",
    ics: "text/calendar",
    vcf: "text/vcard",
    vcard: "text/vcard",
  };

  const existingFiles = Array.isArray(twilioConfiRef.current.attachment)
    ? twilioConfiRef.current.attachment
    : [];

  const remainingSlots = Math.max(0, MAX_FILES - existingFiles.length);
  if (remainingSlots === 0) {
    toast.warn(`Maximum ${MAX_FILES} files allowed`);
    return;
  }

  let validFiles = [];
  for (const file of list) {
    const safeName = DOMPurify.sanitize(file.name);
    const mime = file.type;
    const extension = safeName.split(".").pop()?.toLowerCase() || "";
    const inferredMime = mime || extensionMimeMapping[extension] || "";

    if (!allowedMimeTypes[category].includes(inferredMime)) {
      toast.error(`Unsupported file type: ${safeName}`);
      continue;
    }

    if (file.size > maxFileSize) {
      toast.error(`File size exceeds 600KB: ${safeName}`);
      continue;
    }

    // check duplicates (name + size + lastModified for robustness)
    const isDuplicate =
      existingFiles.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified) ||
      validFiles.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified);

    if (isDuplicate) {
      toast.error(`Duplicate file skipped: ${file.name}`);
      continue;
    }

    validFiles.push(file);
  }

  // enforce remaining capacity
  const accepted = validFiles.slice(0, remainingSlots);
  const skippedCount = validFiles.length - accepted.length;

  if (accepted.length > 0) {
    const mergedFiles = [...existingFiles, ...accepted];

    dispatchTwilioConfig({
      type: "SET_CONFIG",
      payload: { attachment: mergedFiles },
    });

    twilioConfiRef.current = {
      ...twilioConfiRef.current,
      attachment: mergedFiles,
    };

    setFileCategory(category);
    setShowOptions(false);
    setOpenModal(true);
  }
};


  // ✅ Allow Adding More Files
  const handleAddMoreFiles = () => {
  if (!fileCategory) {
    toast.warn("Please select a file type first.");
    return;
  }

  const currentLen = twilioConfiRef.current?.attachment?.length || 0;
  if (currentLen >= MAX_FILES) {
    return toast.error(`Maximum ${MAX_FILES} files allowed`);
  }

  const acceptTypes = allowedMimeTypes[fileCategory].join(",");
  handleFileInput(acceptTypes, fileCategory);
};

  // ✅ Camera Capture Handling
  const handleImageCapture = (imageFile) => {
    handleFileSelection([imageFile], "media");
    setShowWebcam(false);
  };

  // ✅ File Input Handlers
  const handleFileInput = (acceptTypes, category) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = acceptTypes;
    fileInput.multiple = true;
    fileInput.onchange = (event) => handleFileSelection(event.target.files, category);
    fileInput.click();
  };

  // ✅ Remove Individual File
  const handleRemoveFile = (index) => {
  const updatedFiles = (twilioConfiRef.current?.attachment || []).filter((_, i) => i !== index);

  dispatchTwilioConfig({ type: "SET_CONFIG", payload: { attachment: updatedFiles } });

  twilioConfiRef.current = { ...twilioConfiRef.current, attachment: updatedFiles };

  if (updatedFiles.length === 0) {
    setFileCategory(null);
    setShowOptions(true);
  }
};

  // ✅ Remove All Files
  const handleRemoveAll = () => {
  dispatchTwilioConfig({ type: "SET_CONFIG", payload: { attachment: [] } });
  twilioConfiRef.current = { ...twilioConfiRef.current, attachment: [] };
  setFileCategory(null);
  setShowOptions(true);
};

  // ✅ Options for Media Upload
  const options = [
    {
      icon: <TiCamera />,
      name: "Camera",
      onClick: () => {
        setShowOptions(false);
        setShowWebcam(true);
      },
    },
    {
      icon: <HiDocumentText />,
      name: "Document",
      onClick: () => handleFileInput(
        allowedMimeTypes.document.join(","),
        "document"
      ),
    },
    {
      icon: <BsImage />,
      name: "Media",
      onClick: () => handleFileInput(
        allowedMimeTypes.media.join(","),
        "media"
      ),
    },
    {
      icon: <IoMusicalNote />,
      name: "Audio",
      onClick: () => handleFileInput(
        allowedMimeTypes.audio.join(","),
        "audio"
      ),
    }
  ];

  return (
    <Box className="mediaInnerComponent" sx={{
      display: "flex",
      position: "relative",
      width: "100%",
    }}>
      {/* ✅ Show Options Menu */}
      {showOptions && twilioConfiRef.current.attachment.length === 0 ? (
        <div className="navigation" ref={menuRef}>
          <ul className="menu">
            {options.map((option, index) => (
              <li
                key={index}
                className="list"
                onMouseEnter={() => {
                  setActive(index);
                }}
                onMouseLeave={() => {
                  setActive(0);
                }}
              >
                <div className="menu-link" onClick={option.onClick}>
                  <div className="icon">{option.icon}</div>
                  <span className="text">{option.name}</span>
                </div>
              </li>
            ))}
          </ul>
          {showIndicator && (
            <div className="indicator" style={{
              transform: `translateX(${options[active]?.dis}px)`,
            }}></div>
          )}
        </div>
      ) : twilioConfiRef.current.attachment.length > 0 && (
          <Box className="filePreviewContainer">
          <FilePreview 
            files={twilioConfiRef.current.attachment} 
            removeFile={handleRemoveFile} 
            addMore={handleAddMoreFiles}
            removeAll={handleRemoveAll}
            handleModal={() => setOpenModal(false)}
          />
        </Box>
      )}
      {/* ✅ Webcam Capture */}
      {showWebcam && <CustomWebcam onImageCapture={handleImageCapture} onClose={() => setShowWebcam(false)} />}
    </Box>
  );
};

export default MediaComponent;

