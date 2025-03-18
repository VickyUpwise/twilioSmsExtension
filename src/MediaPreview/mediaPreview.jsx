import React, { useState,useEffect } from "react";
import { FileIcon, defaultStyles } from "react-file-icon";
import { RiDeleteBin6Fill } from "react-icons/ri";
import "./mediaPreview.scss";
import { Tooltip } from "@mui/material";
import { DeleteOutlineOutlined } from "@mui/icons-material";

const FilePreview = ({ files, removeFile, removeAll, addMore }) => {
  const [selectedIndex, setSelectedIndex] = useState(0); // ✅ Track currently selected file

  // ✅ Reset selectedIndex if files are removed
  useEffect(() => {
    if (files.length === 0) {
      setSelectedIndex(0);
    } else if (selectedIndex >= files.length) {
      setSelectedIndex(files.length - 1);
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
      <Tooltip title={file.name} key={index}>
      <div className={`thumbnail-container ${index === selectedIndex ? "active-thumbnail" : ""}`}>
        <div
          className="thumbnail"
          onClick={() => setSelectedIndex(index)}
        >
          {["jpg", "jpeg", "png", "bmp", "gif"].includes(fileType) && (
            <img src={fileUrl} alt="preview" className="thumbnail-img" />
          )}
          {["mp4", "webm"].includes(fileType) && (
            <video src={fileUrl} className="thumbnail-video" />
          )}
          {["mp3", "wav"].includes(fileType) && (
            <div className="thumbnail-audio">🎵</div>
          )}
          {["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(fileType) && (
            <div className="file-icon">
              <FileIcon extension={fileType} {...defaultStyles[fileType]} />
            </div>
          )}
        </div>

        {/* ✅ Delete Button (Shows only for the active thumbnail) */}
        {index === selectedIndex && (
          <button className="delete-btn" onClick={(e) => {removeFile(index); }}>
            <RiDeleteBin6Fill />
          </button>
        )}
      </div>
    </Tooltip>
    );
  };

  return (
    <div className="file-preview-wrapper">
      <div className="main-preview">
        {files.length > 0 ? (
          <>
            <div className="preview-content">
              {["jpg", "jpeg", "png", "bmp", "gif"].includes(files[selectedIndex]?.name.split(".").pop().toLowerCase()) && (
                <img src={URL.createObjectURL(files[selectedIndex])} alt="preview" className="large-preview" />
              )}
              {["mp4", "webm"].includes(files[selectedIndex]?.name.split(".").pop().toLowerCase()) && (
                <video src={URL.createObjectURL(files[selectedIndex])} controls className="large-preview" />
              )}
              {["mp3", "wav"].includes(files[selectedIndex]?.name.split(".").pop().toLowerCase()) && (
                <audio src={URL.createObjectURL(files[selectedIndex])} controls className="audio-preview" />
              )}

              {/* ✅ Proper Document Preview Handling */}
              {files[selectedIndex]?.name.endsWith(".pdf") ? (
                <iframe 
                  src={URL.createObjectURL(files[selectedIndex])} 
                  className="pdf-preview" 
                  title="PDF Preview"
                />
              ) : ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(files[selectedIndex]?.name.split(".").pop().toLowerCase()) && (
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
        <div className="addbutton">
        <button className="add-btn" onClick={addMore}>+</button>
        <button className="add-btn" onClick={removeAll}><DeleteOutlineOutlined/></button>
        </div>
        <div className="smallPreview">
        {files.length > 0 ? (
          files.map((file, index) => renderFilePreview(file, index))
        ) : (
          <div className="no-file">No files selected</div>
        )}
        </div>
      </div>
    </div>
  );
};

export default FilePreview;