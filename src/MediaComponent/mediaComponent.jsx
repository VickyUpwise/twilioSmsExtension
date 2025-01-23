import React, { useRef, useState, useEffect } from "react";
import "./mediaComponent.scss";
import { Box} from "@mui/material";
import { CameraAlt, Description, PhotoLibrary, Audiotrack} from "@mui/icons-material";
import axios from 'axios';
import { toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FilePreview from "../MediaPreview/mediaPreview";
import CustomWebcam from "../WebCam/webCam";
import loadingVideo from '../utility/Skate.mp4'
import Waveloading from '../utility/Loading.gif'
import errorImage from '../utility/544 404 Error Text High Res Vector Graphics.jpeg'
import { TbXboxX } from "react-icons/tb";

const MediaComponent = ({ mediaComponent, attachment, attachmentUrl, setAttachment, setAttachmentUrl, }) => {
  const [fileType, setFileType] = useState(null);
  const [showOptions, setShowOptions] = useState(true)
  const [showWebcam, setShowWebcam] = useState(false);
  const [active, setActive] = useState(0);
  const [showIndicator, setShowIndicator] = useState(false)
  const [showError, setShowError] = useState(false);
  const [showLoader, setShowLoader] = useState(false)
  const accessTokenRef = useRef("");
  const clientIdRef = useRef("");
  const clientSecretRef = useRef("");
  const refreshTokenRef = useRef("");
  const parentIdRef = useRef("");
  const REDIRECT_URI = "https://workdrive.zoho.com/";

  useEffect(() => {
    console.log("useffect called")
    fetchZohoWorkDriveDetails();
  }, [mediaComponent]);

  const fetchZohoWorkDriveDetails = async () => {
    try {
      const clientId = await ZOHO.CRM.API.getOrgVariable(
        "twiliophonenumbervalidatorbyupro__work_drive_clientId"
      );
      const clientSecret = await ZOHO.CRM.API.getOrgVariable(
        "twiliophonenumbervalidatorbyupro__work_drive_client_secret"
      );
      const aToken = await ZOHO.CRM.API.getOrgVariable(
        "twiliophonenumbervalidatorbyupro__work_drive_access_token"
      );
      const rToken = await ZOHO.CRM.API.getOrgVariable(
        "twiliophonenumbervalidatorbyupro__work_drive_refresh_token"
      );
      const parent_i_d = await ZOHO.CRM.API.getOrgVariable(
        "twiliophonenumbervalidatorbyupro__parentId"
      );
  
      clientIdRef.current = clientId.Success.Content || "";
      clientSecretRef.current = clientSecret.Success.Content || "";
      accessTokenRef.current = aToken.Success.Content || "";
      refreshTokenRef.current = rToken.Success.Content || "";
      parentIdRef.current = parent_i_d.Success.Content || "";
  
      console.log("Fetched details:", {
        clientId: clientIdRef.current,
        clientSecret: clientSecretRef.current,
        accessToken: accessTokenRef.current,
        refreshToken: refreshTokenRef.current,
        parentId: parentIdRef.current,
      });
    } catch (error) {
      console.error("Error getting Zoho WorkDrive details", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  // Step 1: Redirect user to Zoho OAuth Authorization Page
  // const initiateZohoAuth = () => {
  //   console.log('client id', clientId)
  //   const authUrl = `https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=${clientId}&scope=WorkDrive.files.ALL&redirect_uri=${REDIRECT_URI}&access_type=offline&prompt=consent`;
  //   const popup = window.open(authUrl, "_blank", "width=500,height=700");
  //   const interval = setInterval(() => {
  //     try {
  //       if (popup.closed) {
  //         clearInterval(interval);
  //         alert("Authorization process interrupted.");
  //       } else if (popup.location.href.includes("code")) {
  //         const code = new URL(popup.location.href).searchParams.get("code");
  //         fetchAccessToken(code);
  //         popup.close();
  //         clearInterval(interval);
  //       }
  //     } catch (e) {
  //       // Cross-origin restriction; ignore
  //     }
  //   }, 1000);
  // };

  // Step 2: Exchange Authorization Code for Access Token
  //   const fetchAccessToken = async (code) => {
  //   try {
  //     const response = await axios.post(
  //       "https://accounts.zoho.com/oauth/v2/token",
  //       new URLSearchParams({
  //         code: code, // The authorization code received
  //         client_id: clientId, // Your client ID from API Console
  //         client_secret: clientSecret, // Your client secret from API Console
  //         redirect_uri: REDIRECT_URI, // The redirect URI configured in API Console
  //         grant_type: "authorization_code", // Always "authorization_code" for this flow
  //       }),
  //       {
  //         headers: {
  //           "Content-Type": "application/x-www-form-urlencoded",
  //         },
  //       }
  //     );

  //     const { access_token, refresh_token } = response.data;
  //     console.log("Access Token:", access_token);
  //     setAccessToken(access_token);
  //     setRefreshToken(refresh_token);
  //   } catch (error) {
  //     console.error("Error fetching access token:", error.response?.data || error);
  //     alert("Failed to fetch access token. Please try again.");
  //   }
  // };

  // Step 3: Upload File to Zoho WorkDrive

  const uploadFileToZoho = async (file , token = accessTokenRef.current) => {
    const formData = new FormData();
  formData.append("content", file);
  formData.append("parent_id", parentIdRef.current);

  console.log("Access token being used:", token);

  // if (!token) {
  //   // Fetch the token if it's missing
  //   const aToken = await ZOHO.CRM.API.getOrgVariable(
  //     "twiliophonenumbervalidatorbyupro__work_drive_access_token"
  //   );
  //   token = aToken.Success.Content;
  //   accessTokenRef.current = token;
  // }

  try {
    const response = await axios.post(
      "https://127.0.0.1:5000/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Zoho-oauthtoken ${token}`,
          parentId: parentIdRef.current,
        },
      }
    );

    if (parentIdRef.current !== response.data.parentID) {
      const data = {
        apiname: "twiliophonenumbervalidatorbyupro__parentId",
        value: response.data.parentID,
      };
      parentIdRef.current = response.data.parentID;
      await ZOHO.CRM.CONNECTOR.invokeAPI("crm.set", data);
    }

    setAttachmentUrl(response.data.permalink);
    setFileType(file.name.split(".").pop());
    } catch (error) {
      if (
        error.response?.status === 500 &&
        error.response?.data?.message === "Invalid OAuth token."
      ) {
        const newAccessToken = await refreshAccessToken();
        uploadFileToZoho(file , newAccessToken);
      } else if (
        error.response?.status === 400 &&
        error.response?.data?.message === "Parameter length more than permitted"
      ) {
        setShowError(true)
        toast.error("File name is too long. Please rename the file.");
      } else if (
        error.response?.status === 400 &&
        error.response?.data?.error === "No file uploaded"
      ) {
        setShowError(true)
        toast.error("Something went wrong. Please refresh the page.");
      } else {
        console.error("File upload failed:", error.response?.data || error);
        setShowError(true)
        toast.error("Failed to upload file. Please try again.");
      }
    }
  };

  const handleFileSelection = (file) => {
    if (file.size > 250 * 1024 * 1024) {
      toast.error(
        "File size exceeds 250MB limit. Please reduce the file size."
      );
      return;
    }
    setAttachment(file);
    setShowOptions(false); // Hide the options card
    uploadFileToZoho(file);
  };

  const handleCameraClick = () => {
    setShowOptions(false);
    setShowWebcam(true); // Show the CustomWebcam component

  };

  const handleImageCapture = (imageSrc) => {
    handleFileSelection(imageSrc); // Save the captured image
    setShowWebcam(false); // Close the webcam component
  };

  const handleDocumentClick = () => {
    const documentInput = document.createElement("input");
    documentInput.type = "file";
    documentInput.accept =
      "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation";
    documentInput.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        handleFileSelection(file);
      }
    };
    documentInput.click();
  };

  const handleMediaClick = () => {
    const mediaInput = document.createElement("input");
    mediaInput.type = "file";
    mediaInput.accept = "image/*,video/*";
    mediaInput.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        handleFileSelection(file);
      }
    };
    mediaInput.click();
  };

  const handleMp3Click = () => {
    const audioInput = document.createElement("input");
    audioInput.type = "file";
    audioInput.accept = "audio/mp3"; // Restrict to MP3 files
    audioInput.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        handleFileSelection(file); // Process the selected MP3 file
      }
    };
    audioInput.click();
  };

  const handleRemove = () => {
    setAttachment(null);
    setAttachmentUrl(null);
    setShowOptions(true);
  }
  
  const handleShowError = () => {
    setShowError(false);
    handleRemove();
}

  const options = [
    {
      icon: <CameraAlt fontSize="medium" />,
      name: "Camera",
      onClick: handleCameraClick,
      dis: "-109",
    },
    {
      icon: <Description fontSize="medium" />,
      name: "Document",
      onClick: handleDocumentClick,
      dis: "-36",
    },
    {
      icon: <PhotoLibrary fontSize="medium" />,
      name: "Media",
      onClick: handleMediaClick,
      dis: "39",
    },
    {
      icon: <Audiotrack fontSize="medium" />,
      name: "Audio",
      onClick: handleMp3Click,
      dis: "114",
    },
  ];

  const refreshAccessToken = async () => {
    try {
      const response = await axios.post(
        "https://127.0.0.1:5000/refresh-token",
        {
          refresh_token: refreshTokenRef.current,
          client_id: clientIdRef.current,
          client_secret: clientSecretRef.current,
        }
      );
  
      const { access_token } = response.data;
  
      accessTokenRef.current = access_token; // Update the ref
  
      const data = {
        apiname: "twiliophonenumbervalidatorbyupro__work_drive_access_token",
        value: access_token,
      };
  
      await ZOHO.CRM.CONNECTOR.invokeAPI("crm.set", data);
      console.log("Access token refreshed:", access_token);
  
      return access_token; // Return the new token
    } catch (error) {
      console.error("Error refreshing access token:", error);
      toast.error(
        "Failed to refresh Zoho WorkDrive access token. Please reauthorize."
      );
    }
  };

  return (
    // <Box className="mediaInnerComponent"
    //   sx={{
    //     display: "flex",
    //     flexDirection: "column",
    //     position: "absolute",
    //     bottom: '58px',
    //     left: '80px',
    //   }}
    // >
    //   {showOptions ? (
    //           <div className="navigation">
    //             <ul className="menu">
    //             {options.map((option, index) => (
    //               <li key={index} className="list" onMouseEnter={() => {
    //                 setActive(index);
    //                 setShowIndicartor(true);
    //               }}
    //               onMouseleave={() => { setActive(0);
    //                 setShowIndicartor(false);}}>
    //                 <div
    //                   className="menu-link"
    //                   onClick={() => {
    //                     option.onClick();
    //                   }}
                      
    //                 >
    //                   <div className='icon'>
    //                     {option.icon}
    //                   </div>
    //                   <span className='text'>
    //                     {option.name}
    //                   </span>
    //                 </div>
    //               </li>
    //             ))}
    //           </ul>
    //           {
    //             showIndicator && 
    //           <div className="indicator" style={{
    //       transform: `translateX(${options[active].dis}px)`,
    //     }}></div>
    //           }
    //         </div>
    //   ) : !showError && !attachmentUrl ? (
    //     <Box className="loadingVideoContainer">
    //           {/* <video
    //             src={loading}
    //             autoPlay
    //             loop
    //             muted
    //             className="loadingVideo"
    //           /> */}
    //           <img src={Waveloading} alt='Loading' className="loadingVideo"/>
    //           <span id="loadingcaption">Getting it. Wait a bit..</span>
    //     </Box>
    //   ) : showError ? (
    //     <Box className='errorComponent'>
    //       <img  className="loadingVideo" src={errorImage} alt="error" />
    //       <button onClick={handleShowError} id="errorButton"><TbXboxX /></button>
    //     </Box>
    //   ) : (
    //     <Box className="filePreviewContainer">
    //       <FilePreview fileType={fileType} attachment={attachment} remove={handleRemove} />
    //     </Box>
    //   )}
    //   {showWebcam && (
    //     <CustomWebcam
    //       onImageCapture={handleImageCapture} // Pass the handler for image capture
    //     />
    //   )}
    // </Box>
    <Box
  className="mediaInnerComponent"
  sx={{
    display: "flex",
    flexDirection: "column",
    position: "absolute",
    bottom: "58px",
    left: "80px",
  }}
>
  {showOptions && !attachment && !showError && !attachmentUrl ? (
    <div className="navigation">
      <ul className="menu">
        {options.map((option, index) => (
          <li
            key={index}
            className="list"
            onMouseEnter={() => {
              setActive(index);
              setShowIndicator(true);
            }}
            onMouseLeave={() => {
              setActive(0);
              setShowIndicator(false);
            }}
          >
            <div
              className="menu-link"
              onClick={() => {
                option.onClick();
              }}
            >
              <div className="icon">{option.icon}</div>
              <span className="text">{option.name}</span>
            </div>
          </li>
        ))}
      </ul>
      {showIndicator && (
        <div
          className="indicator"
          style={{
            transform: `translateX(${options[active]?.dis}px)`,
          }}
        ></div>
      )}
    </div>
  ) : showError ? (
    <Box className="errorComponent">
      <img className="loadingVideo" src={errorImage} alt="error" />
      <button onClick={handleShowError} id="errorButton">
        <TbXboxX />
      </button>
    </Box>
  ) : !attachmentUrl && attachment ? (
    <Box className="loadingVideoContainer">
      <img src={Waveloading} alt="Loading" className="loadingVideo" />
      <span id="loadingcaption">Getting it. Wait a bit...</span>
    </Box>
  ) : attachmentUrl ? (
    <Box className="filePreviewContainer">
      <FilePreview
        fileType={fileType}
        attachment={attachment}
        remove={handleRemove}
      />
    </Box>
  ) : null}
  {showWebcam && <CustomWebcam onImageCapture={handleImageCapture} />}
</Box>

  );
};

export default MediaComponent;
