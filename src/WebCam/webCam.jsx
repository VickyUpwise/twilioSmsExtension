import React, { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import "./webCam.css";
import { IoCameraOutline } from "react-icons/io5";
import { MdOutlineCameraswitch } from "react-icons/md";
import { SlReload } from "react-icons/sl";
import { MdOutlineDone } from "react-icons/md";

const CustomWebcam = ({ onImageCapture, onClose}) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [mirrored, setMirrored] = useState(false);

  // Function to convert Base64 to Blob
  const base64ToBlob = (base64, mimeType = "image/jpeg") => {
    const byteCharacters = atob(base64.split(",")[1]);
    const byteNumbers = Array.from(byteCharacters).map((char) =>
      char.charCodeAt(0)
    );
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  // Capture function
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
  }, [webcamRef]);

  const retake = () => {
    setImgSrc(null); // Reset the captured image
  };

  const handleSelect = () => {
    if (imgSrc) {
      const blob = base64ToBlob(imgSrc);
      const file = new File([blob], "captured-image.jpg", { type: "image/jpeg" });
      onImageCapture(file);
    }
  };

  const handleUserMediaError = (error) => {
    console.error("Error accessing webcam:", error);
    onClose(false); // Close the webcam component if permission is denied
  };

  return (
    <div className="webcamContainer">
      {!imgSrc ? (
        <div className="cameraContainer">
          <Webcam
            height={250}
            width={500}
            ref={webcamRef}
            mirrored={mirrored}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.8}
            className="webcam"
            onUserMediaError={handleUserMediaError}
          />
          <div className="cameraOverlay">
            <div className="mirrorToggle">
              <input
                type="checkbox"
                checked={mirrored}
                onChange={(e) => setMirrored(e.target.checked)}
              />
              <label><MdOutlineCameraswitch /></label>
            </div>
            <button className="captureButton" onClick={capture}>
                <IoCameraOutline />
            </button>
          </div>
        </div>
      ) : (
        <div className="imageContainer">
          <img src={imgSrc} alt="Captured" id="image" className="capturedImage" />
          <div className="imageOverlay">
            <button className="retakeButton" onClick={retake}>
            <SlReload />
            </button>
            <button className="selectButton" onClick={handleSelect}>
            <MdOutlineDone />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomWebcam;
