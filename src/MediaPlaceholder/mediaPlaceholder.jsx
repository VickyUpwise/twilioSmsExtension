import { useState } from "react";
import axios from "axios";
import './mediaPlaceholder.scss'
import { RiEyeCloseFill } from "react-icons/ri";
import Lottie from "lottie-react";
import loadingAnimation from "../utility/loading.json";

const MediaPlaceholder = ({conversationSid, mediaSid }) => {
  const [mediaUrl, setMediaUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [error, setError] = useState(false);

  const fetchMediaUrl = async () => {
    setLoading(true);
    setButtonDisabled(true);
    try {
        const response = await ZOHO.CRM.FUNCTIONS.execute(
            "twiliophonenumbervalidatorbyupro__getMediaPreviewLink",
            {
              arguments: JSON.stringify({
                conversation_sid: conversationSid,
                media_sid: mediaSid,
              }),
            }
          );

          const output = JSON.parse(response.details.output)

      if (output.links.content_direct_temporary) {
        setMediaUrl(output.links.content_direct_temporary);
      }
    } catch (error) {
      console.error("❌ Error fetching media:", error);
      setError(true);
      setButtonDisabled(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mediaContainer">
      {!mediaUrl ? (
        <div className="mediaPlaceholder">
          <button onClick={fetchMediaUrl} disabled={buttonDisabled}>
            {loading ? <div style={{ width: 50, height: 50, background: 'none', color: "#ffffff",}}>
      <Lottie animationData={loadingAnimation} loop={true} />
    </div> : <RiEyeCloseFill />}
          </button>
        </div>
      ) : (
          error ? (<div className="error">Can't load preview.</div> ): (<img src={mediaUrl} alt="Media" className="mediaPreview" />)
        
      )}
    </div>
  );
};

export default MediaPlaceholder;
