import React from "react";
import { FileIcon, defaultStyles } from "react-file-icon";
import "./mediaPreview.scss";
import { IoReloadOutline } from "react-icons/io5";
import { RiDeleteBin6Fill } from "react-icons/ri";

const FilePreview = ({ fileType, attachment, remove }) => {
  const supportedFileViewerTypes = [
    "jpg",
    "png",
    "mp4",
    "jpeg",
    "bmp",
    "csv",
    "webm",
    "mp3",
    "gif",
  ]; // Add other FileViewer-supported types here
  const docViewerSupportedTypes = [
    "doc",
    "docx",
    "xls",
    "pdf",
    "xlsx",
    "ppt",
    "pptx",
  ]; // Office file types

  // Extract file details
  const { name, size } = attachment;

  // Helper function to format file size
  const formatFileSize = (size) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatFileType = (fileExtension) => {
    const fileTypeMapping = {
      doc: "Word Document (.doc)",
      docx: "Word Document (.docx)",
      xls: "Excel Spreadsheet (.xls)",
      xlsx: "Excel Spreadsheet (.xlsx)",
      ppt: "PowerPoint Presentation (.ppt)",
      pptx: "PowerPoint Presentation (.pptx)",
      jpg: "Image File (.jpg)",
      png: "Image File (.png)",
      jpeg: "Image File (.jpeg)",
      bmp: "Bitmap Image (.bmp)",
      gif: "GIF Image (.gif)",
      mp4: "Video File (.mp4)",
      webm: "Video File (.webm)",
      mp3: "Audio File (.mp3)",
      csv: "CSV File (.csv)",
      pdf: "PDF Document (.pdf)",
    };
    

    return fileTypeMapping[fileExtension.toLowerCase()] || "Unknown File Type";
  };

  const renderPreview = () => {
    const file = URL.createObjectURL(attachment);
    switch (fileType) {
      case "jpg":
      case "jpeg":
      case "png":
      case "bmp":
      case "gif":
        return <img src={file} alt="Preview" className="image-preview" />;

      case "mp4":
      case "webm":
        return (
          <video
            src={file}
            controls
            className="video-preview"
            preload="metadata"
          />
        );

      case "mp3":
        return (
          <div className="audio-preview">
            <audio src={file} controls preload="metadata" />
          </div>
        );

      case "csv":
        return (
          <div className="file-preview">
            <p>{file.split("/").pop()}</p>
          </div>
        );

      default:
        return <p>Unsupported file type</p>;
    }
  };

  const getFilePreviewComponent = () => {
    // Handle FileViewer-supported types
    if (supportedFileViewerTypes.includes(fileType)) {
      return (
        <div className="previewContainer">
          <div className="file-preview-container">
              <div className="file-actions">
                <button onClick={remove} className="action-btn"><RiDeleteBin6Fill /></button>
              </div>
            <div className="file-body">{renderPreview()}</div>
          </div>
          <div className="previewContentDetails">
            <span>{name}</span>
            <span>
              {formatFileSize(size)}, {formatFileType(fileType)}
            </span>
          </div>
        </div>
      );
    }

    // Handle react-doc-viewer-supported types
    if (docViewerSupportedTypes.includes(fileType)) {
      return (
        <div className="previewContainer">
          <div className="file-actions">
                <button onClick={remove} className="action-btn"><RiDeleteBin6Fill /></button>
              </div>
          <div
            style={{
              maxWidth: "70px",
              width: "70px",
              height: "70px",
              maxheight: "70px",
              marginBottom: "15px",
            }}
          >
            <FileIcon extension={fileType} {...defaultStyles[fileType]} />
          </div>
          <div className="previewContentDetails">
            <span>{name}</span>
            <span>
              {formatFileSize(size)}, {formatFileType(fileType)}
            </span>
          </div>
        </div>
      );
    }

    // Fallback for unsupported types
    return (
      <iframe
        src="https://assets.pinterest.com/ext/embed.html?id=956803883333887163"
        height="359"
        width="345"
        frameborder="0"
        scrolling="no"
      ></iframe>
    );
  };

  return (
    <>
      {fileType ? (
        getFilePreviewComponent()
      ) : (
        <iframe
          src="https://assets.pinterest.com/ext/embed.html?id=956803883333886760"
          height="359"
          width="345"
          frameborder="0"
          scrolling="no"
        ></iframe>
      )}
    </>
  );
};

export default FilePreview;
