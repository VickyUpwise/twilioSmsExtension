import { useState, useEffect } from "react";
import axios from "axios";
import './mediaPlaceholder.scss';
import { RiEyeCloseFill } from "react-icons/ri";
import { MdOutlineFileDownload } from "react-icons/md";
import Lottie from "lottie-react";
import loadingAnimation from "../../utility/loading.json";
import DOMPurify from 'dompurify';
import {fetchMediaDetails} from '../../ContextApi/twilioApis'
import { useTwilioConfig } from "../../ContextApi/twilioConfigContext";

const MediaPlaceholder = ({ mediaSid}) => {
  const { twilioConfig, dispatchTwilioConfig } = useTwilioConfig();
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaInfo, setMediaInfo] = useState(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [error, setError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if(mediaSid && !mediaUrl){
      fetchMediaUrl()
    }
  },[mediaSid])

  

  const fetchMediaUrl = async () => {
  setLoadingMedia(true);
  setButtonDisabled(true);

  try {
    const response = await fetchMediaDetails(twilioConfig.userID, mediaSid);

    const {
      success,
      file,            // base64 string
      filename,
      contentType,
      size,
      date_created,
      source
    } = response;
    

    if (success && file) {
      // 🔁 Convert base64 to Blob
      const byteCharacters = atob(file);
      const byteArrays = [];

      for (let i = 0; i < byteCharacters.length; i += 512) {
        const slice = byteCharacters.slice(i, i + 512);
        const byteNumbers = new Array(slice.length);

        for (let j = 0; j < slice.length; j++) {
          byteNumbers[j] = slice.charCodeAt(j);
        }

        byteArrays.push(new Uint8Array(byteNumbers));
      }

      const blob = new Blob(byteArrays, { type: contentType });

      // ✅ Create object URL for rendering
      const objectUrl = URL.createObjectURL(blob);

      setMediaUrl(objectUrl);
      setMediaInfo({
        filename,
        size,
        contentType,
      });
    } else {
      console.error("⚠️ No valid media found in response");
      setError(true);
      setButtonDisabled(false);
    }
  } catch (error) {
    console.error("❌ Error fetching media details:", error);
    setError(true);
    setButtonDisabled(false);
  } finally {
    setLoadingMedia(false);
  }
};



  const isPreviewable = (type) => {
  return (
    type.startsWith("image/") ||
    type.startsWith("video/") ||
    type.startsWith("audio/")
  );
};

  const formatSize = (sizeInBytes) => {
    if (!sizeInBytes) return '';
    const sizeInKB = (sizeInBytes / 1024).toFixed(1);
    return `${sizeInKB} KB`;
  };

  const formatFileType = (mimeType) => {
    const mapping = {
  "application/pdf": "PDF Document",
  "application/vcard": "vCard File",
  "application/vnd.apple.pkpass": "Apple Pass",
  // "application/msword": "Word Document",
  // "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word Document",
  // "application/vnd.ms-excel": "Excel Spreadsheet",
  // "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel Spreadsheet",
  // "application/vnd.ms-powerpoint": "PowerPoint Presentation",
  // "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint Presentation",
  
  "image/jpeg": "JPEG Image",
  "image/jpg": "JPG Image",
  "image/png": "PNG Image",
  "image/gif": "GIF Image",
  "image/heic": "HEIC Image",
  "image/heif": "HEIF Image",
  "image/tiff": "TIFF Image",
  "image/bmp": "BMP Image",

  "video/mp4": "MP4 Video",
  "video/mpeg": "MPEG Video",
  "video/mpeg4": "MPEG-4 Video",
  "video/quicktime": "QuickTime Video",
  "video/webm": "WebM Video",
  "video/3gpp": "3GPP Video",
  "video/3gpp2": "3GPP2 Video",
  "video/3gpp-tt": "3GPP Timed Text",
  "video/H261": "H.261 Video",
  "video/H263": "H.263 Video",
  "video/H263-1998": "H.263-1998 Video",
  "video/H263-2000": "H.263-2000 Video",
  "video/H264": "H.264 Video",
  "video/H265": "H.265 Video",

  "audio/mp3": "MP3 Audio",
  "audio/mpeg": "MPEG Audio",
  "audio/wav": "WAV Audio",
  "audio/ogg": "OGG Audio",
  "audio/mp4": "MP4 Audio",
  "audio/3gpp": "3GPP Audio",
  "audio/3gpp2": "3GPP2 Audio",
  "audio/basic": "Basic Audio",
  "audio/L24": "L24 Audio",
  "audio/vnd.rn-realaudio": "RealAudio",
  "audio/vnd.wave": "Wave Audio",
  "audio/ac3": "AC3 Audio",
  "audio/webm": "WebM Audio",
  "audio/amr-nb": "AMR-NB Audio",
  "audio/amr": "AMR Audio",

  "text/vcard": "vCard File",
  "text/x-vcard": "vCard File",
  "text/directory": "Directory Text File",
  "text/csv": "CSV File",
  "text/rtf": "Rich Text Format",
  "text/calendar": "Calendar File"
};

  
    return mapping[mimeType] || mimeType.split("/")[1].toUpperCase();
  };

const isTrustedMediaUrl = (url) => {
  return typeof url === "string" && url.startsWith("https://media.us1.twilio.com/");
};

  return (
    <div className="mediaContainer">
      {!mediaUrl ? (
        <div className="mediaPlaceholder">
            {loadingMedia && (
              <div style={{ width: 50, height: 50 }}>
                <Lottie animationData={loadingAnimation} loop={true} />
              </div>
            )}
        </div>
      ) : error ? (
        <div className="error">Can't load preview.</div>
      ) : (
        <>
          {isPreviewable(mediaInfo.contentType) ? (
            <div className="previewContainer">
               {mediaInfo.contentType.startsWith("image/") && (
    <img src={mediaUrl} alt="preview" className="thumbnail" onClick={() => setShowPreview(true)}/>
  )}

  {mediaInfo.contentType.startsWith("video/") && (
    <video
      src={mediaUrl}
      className="thumbnail"
      muted
      playsInline
      preload="metadata"
      onMouseOver={(e) => e.target.play()}
      onMouseOut={(e) => e.target.pause()}
      onClick={() => setShowPreview(true)}
    />
  )}

  {mediaInfo.contentType.startsWith("audio/") && (
    <div className="audio-thumbnail">
      <audio controls src={mediaUrl} className="audio-preview"/>
    </div>
  )}
              {showPreview && (
  <div className="overlay" onClick={() => setShowPreview(false)}>
    <div className="popup">
      {(() => {
        const contentType = mediaInfo.contentType;

        if (contentType.startsWith("video/")) {
          return <video controls src={mediaUrl} />;
        }else if (contentType.startsWith("image/")) {
          return <img src={mediaUrl} alt="full preview" />;
        } else {
          return <p>This file type cannot be previewed.</p>;
        }
      })()}
      <div className="fileDetails">
        <p><strong>Filename:</strong> {DOMPurify.sanitize(mediaInfo.filename)}</p>
        <p><strong>Type:</strong> {mediaInfo.contentType}</p>
        <p><strong>Size:</strong> {formatSize(mediaInfo.size)}</p>
      </div>
    </div>
  </div>
)}

            </div>
          ) : (
            <div className="documentPreview">
              <div className="docInfo">
                <div>
                  <div className="fileName">{DOMPurify.sanitize(mediaInfo.filename)}</div>
                  <div className="fileDetails">{formatSize(mediaInfo.size)}, {formatFileType(mediaInfo.contentType)}</div>
                </div>
              </div>
  <a href={mediaUrl} target="_blank" download className="downloadButton">
    <MdOutlineFileDownload />
  </a>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MediaPlaceholder;
