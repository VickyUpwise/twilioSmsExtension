import React, { useState,useEffect } from "react";
import { FileIcon, defaultStyles } from "react-file-icon";
import { RiDeleteBin6Fill } from "react-icons/ri";
import "./mediaPreview.scss";
import { Tooltip } from "@mui/material";
import { DeleteOutlineOutlined } from "@mui/icons-material";
import DOMPurify from "dompurify";
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FilePreview = ({ files, removeFile, removeAll, addMore,handleSendMedia, handleModal }) => {
  const [selectedIndex, setSelectedIndex] = useState(0); // ✅ Track currently selected file
  const [fileUrl, setFileUrl] = useState("");
  // ✅ Reset selectedIndex if files are removed
  useEffect(() => {
    
    if (files.length === 0) {
      setSelectedIndex(0);
    } else if (selectedIndex >= files.length) {
      setSelectedIndex(files.length - 1);
    }
  }, [files, selectedIndex]);

  useEffect(() => {
    if (files.length > 0 && files[selectedIndex]) {
      const url = URL.createObjectURL(files[selectedIndex]);
      setFileUrl(url);

      // ✅ Clean up the Object URL on component unmount or file change
      return () => URL.revokeObjectURL(url);
    }
  }, [files, selectedIndex]);

  // ✅ Helper function to format file size
  const formatFileSize = (size) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  // ✅ Function to render file previews
  const renderFilePreview = (file, index) => {
    const fileUrl = URL.createObjectURL(file);
    const fileType = file.name.split(".").pop().toLowerCase(); // Extract file extension

    return (
      <Tooltip title={DOMPurify.sanitize(file.name)} key={index}>
      <div className={`thumbnail-container ${index === selectedIndex ? "active-thumbnail" : ""}`}>
        <div
          className="thumbnail"
          onClick={() => setSelectedIndex(index)}
        >
          {["jpg", "jpeg", "png", "gif",].includes(fileType) && (
            <img src={fileUrl} alt="preview" className="thumbnail-img" />
          )}
          {["mp4", "webm"].includes(fileType) && (
            <video src={fileUrl} className="thumbnail-video" />
          )}
          {["mp3", "wav", "ogg"].includes(fileType) && (
            <div className="thumbnail-audio">🎵</div>
          )}
          {["pdf", "vcard", "csv", "calender", "ics", "vcf"].includes(fileType) && (
            <div className="file-icon">
              <FileIcon extension={fileType} {...defaultStyles[fileType]} />
            </div>
          )}
        </div>

        {/* ✅ Delete Button (Shows only for the active thumbnail) */}
        {index === selectedIndex && (
          <button className="delete-btn" onClick={(e) => {removeFile(index); }}>
            <svg width="20" height="20" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M22.75 6.47831C19.1425 6.12081 15.5133 5.93665 11.895 5.93665C9.75 5.93665 7.605 6.04498 5.46 6.26165L3.25 6.47831" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M9.20825 5.38419L9.44659 3.96502C9.61992 2.93585 9.74992 2.16669 11.5808 2.16669H14.4191C16.2499 2.16669 16.3908 2.97919 16.5533 3.97585L16.7916 5.38419" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M20.4208 9.90167L19.7166 20.8108C19.5974 22.5117 19.4999 23.8333 16.4774 23.8333H9.52243C6.49993 23.8333 6.40244 22.5117 6.28327 20.8108L5.5791 9.90167" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M11.1909 17.875H14.7984" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10.2917 13.5417H15.7084" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
          </button>
        )}
      </div>
    </Tooltip>
    );
  };

  const handleSend = () => {
    handleSendMedia()
    handleModal()
  }

  const handleCancel = () => {
    removeFile(0);
    handleModal()
  }

  const fileExt = files[selectedIndex]?.name.split(".").pop().toLowerCase();
const filePreviewUrl = files[selectedIndex] && URL.createObjectURL(files[selectedIndex]);

const imageTypes = ["jpg", "jpeg", "png", "gif",];
const videoTypes = ["mp4", "webm"];
const audioTypes = ["mp3", "wav", "ogg",];
const documentTypes = ["pdf", "txt", "csv","vcard","calender", "ics", "vcf"];

  return (
    <div className="file-preview-wrapper">
      <div className="main-preview">
        {files.length > 0 ? (
          <>
            <div className="preview-content">
              {/* {["jpg", "jpeg", "png", "bmp", "gif", "heic", "heif", "tiff"].includes(files[selectedIndex]?.name.split(".").pop().toLowerCase()) && (
                <img src={URL.createObjectURL(files[selectedIndex])} alt="preview" className="large-preview" />
              )}
              {["mp4", "webm", "mpeg", "mkv", "3gp", "mov", "quicktime"].includes(files[selectedIndex]?.name.split(".").pop().toLowerCase()) && (
                <video src={URL.createObjectURL(files[selectedIndex])} controls className="large-preview" />
              )}
              {["mp3", "wav", "ogg", "m4a", "aac", "3gpp", "3gpp2", "amr"].includes(files[selectedIndex]?.name.split(".").pop().toLowerCase()) && (
                <audio src={URL.createObjectURL(files[selectedIndex])} controls className="audio-preview" />
              )} */}

              {
  imageTypes.includes(fileExt) && (
    <div className="container">
    <img src={filePreviewUrl} alt="Image Preview" className="large-preview" />
    {/* <div className="file-details">
        <span>{files[selectedIndex]?.name}</span>
        <span>{formatFileSize(files[selectedIndex]?.size)}</span>
      </div> */}
    </div>
  )
}

{
  videoTypes.includes(fileExt) && (
    <div className="container">
    <video src={filePreviewUrl} controls className="large-preview" />
    {/* <div className="file-details">
        <span>{files[selectedIndex]?.name}</span>
        <span>{formatFileSize(files[selectedIndex]?.size)}</span>
      </div> */}
    </div>
  )
}

{
  audioTypes.includes(fileExt) && (
    <div className="container">
    <audio src={filePreviewUrl} controls className="audio-preview" />
    <div className="file-details">
        <span>{files[selectedIndex]?.name}</span>
        <span>{formatFileSize(files[selectedIndex]?.size)}</span>
      </div>
    </div>
  )
}

              {/* ✅ Proper Document Preview Handling */}
              {files[selectedIndex]?.name.endsWith(".pdf") ? (
                <iframe 
                  src={fileUrl} 
                  className="pdf-preview" 
                  title="PDF Preview"
                />
              ) : documentTypes.includes(fileExt) && (
                <>
                <div className="doc-preview">
                  <FileIcon extension={files[selectedIndex]?.name.split(".").pop()} {...defaultStyles[files[selectedIndex]?.name.split(".").pop()]}/>
                </div>
                <span>{files[selectedIndex]?.name}</span>
                <span>{formatFileSize(files[selectedIndex]?.size)}</span>
                </>
              )}
            </div>
           
            
          </>
        ) : (
          // ✅ Show "No File Selected" UI
          <div className="no-file">
            <p>No file selected</p>
          </div>
        )}
      </div>
      <div className="sidebar">
        <button className="addbutton" onClick={removeAll}>
              <ClearRoundedIcon/>
        </button>
        <div className="smallPreview">
        {files.length > 0 ? (
          files.map((file, index) => renderFilePreview(file, index))
        ) : (
          <div className="no-file">No files selected</div>
        )}
        
        </div>
        <button className="addbutton" onClick={addMore}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M8 12H16" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 16V8" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
      </div>
       { /*<div className="actionButtons">
        <button onClick={handleSend}>Send</button>
        <button onClick={handleCancel}>
          Cancel
        </button>
      </div> */}
      {/* <ToastContainer
                  // position="top-center"
                  className="custom-toast-container"
                  autoClose={2000}
                  hideProgressBar={false}
                  newestOnTop
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="light"
                  limit={1}
                /> */}
    </div>
  );
};

export default FilePreview;