import React, { useRef, useState, useEffect } from "react";
import "./mediaComponent.scss";
import { Box} from "@mui/material";
import { CameraAlt, Description, PhotoLibrary, Audiotrack} from "@mui/icons-material";
import { toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FilePreview from "../MediaPreview/mediaPreview";
import CustomWebcam from "../WebCam/webCam";

const MediaComponent = ({mediaComponent, attachment, setAttachment}) => {
  const [showOptions, setShowOptions] = useState(true);
  const [showWebcam, setShowWebcam] = useState(false);
  const [active, setActive] = useState(0);
  const [showIndicator, setShowIndicator] = useState(false);
  const [fileCategory, setFileCategory] = useState(null); // ✅ Tracks file category

  // ✅ Allowed MIME Types and Size Limits
  const allowedMimeTypes = {
    media: ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/mpeg", "video/quicktime"],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ],
    audio: ["audio/mp3", "audio/mpeg", "audio/wav"]
  };
  const maxFileSize = 25 * 1024 * 1024; // ✅ 25MB file size limit

  // ✅ File Validation & Adding to Array
  const handleFileSelection = (files, category) => {
    if (!files.length) return;

    // Prevent mixing different file categories
    if (fileCategory && fileCategory !== category) {
      toast.error("❌ You can only upload one type of file at a time.");
      return;
    }

    let validFiles = [];

    for (const file of files) {
      if (!allowedMimeTypes[category].includes(file.type)) {
        toast.error(`❌ Unsupported file type: ${file.name}`);
        continue;
      }
      if (file.size > maxFileSize) {
        toast.error(`❌ File size exceeds 25MB: ${file.name}`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setAttachment((prevFiles) => [...prevFiles, ...validFiles]); // ✅ Add valid files to array
      setFileCategory(category);
      setShowOptions(false); // Hide options after selection
    }

console.log("Selected Files:", validFiles)
  };

  // ✅ Allow Adding More Files
  const handleAddMoreFiles = () => {
    if (!fileCategory) {
      toast.error("Please select a file type first.");
      return;
    }

    let acceptTypes = allowedMimeTypes[fileCategory].join(",");
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
    const updatedFiles = attachment.filter((_, i) => i !== index);
    setAttachment(updatedFiles);

    if (updatedFiles.length === 0) {
      setFileCategory(null); // Reset category if no files left
      setShowOptions(true);
    }
  };

  // ✅ Remove All Files
  const handleRemoveAll = () => {
    setAttachment([]);
    setFileCategory(null);
    setShowOptions(true);
  };

  // ✅ Options for Media Upload
  const options = [
    {
      icon: <CameraAlt fontSize="medium" />,
      name: "Camera",
      onClick: () => {
        setShowOptions(false);
        setShowWebcam(true);
      },
      dis: "-109"
    },
    {
      icon: <Description fontSize="medium" />,
      name: "Document",
      onClick: () => handleFileInput(
        allowedMimeTypes.document.join(","),
        "document"
      ),
      dis: "-36"
    },
    {
      icon: <PhotoLibrary fontSize="medium" />,
      name: "Media",
      onClick: () => handleFileInput(
        allowedMimeTypes.media.join(","),
        "media"
      ),
      dis: "39"
    },
    {
      icon: <Audiotrack fontSize="medium" />,
      name: "Audio",
      onClick: () => handleFileInput(
        allowedMimeTypes.audio.join(","),
        "audio"
      ),
      dis: "114"
    }
  ];

  return (
    <Box className="mediaInnerComponent" sx={{
      display: "flex",
      flexDirection: "column",
      position: "absolute",
      bottom: "58px",
      left: "68px",
    }}>
      {/* ✅ Show Options Menu */}
      {showOptions && attachment.length === 0 ? (
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
      ) : (
        // ✅ Show File Preview for Selected Files
        <Box className="filePreviewContainer">
          <FilePreview 
            files={attachment} 
            removeFile={handleRemoveFile} 
            removeAll={handleRemoveAll} 
            addMore={handleAddMoreFiles} // ✅ Pass Add More Function
          />
        </Box>
      )}

      {/* ✅ Webcam Capture */}
      {showWebcam && <CustomWebcam onImageCapture={handleImageCapture} onClose={() => setShowWebcam(false)} />}
    </Box>
  );
};

export default MediaComponent;

// const accessTokenRef = useRef("");
  // const clientIdRef = useRef("");
  // const clientSecretRef = useRef("");
  // const refreshTokenRef = useRef("");
// const REDIRECT_URI = "https://plugin-twiliophonenumbervalidatorbyupro.zohosandbox.com/crm/tab/Leads/";

  // useEffect(() => {
  //  getZohoWorkdriveDetails();
  // }, [mediaComponent]);

  // const connectorAuthorization = async () => {
  //   try{
  //     const connector_name = 'twiliophonenumbervalidatorbyupro.zohoworkdrive'
  //     const response = await ZOHO.CRM.CONNECTOR.authorize(connector_name);
  //     console.log('response of connector', response);
  //   }
  //   catch(error){
  //     console.log('error in auth', error)
  //   }
  // }

  // const getZohoWorkdriveDetails = async () => {
  //   try {
  //     // Step 1: Get User ID
  //     const userResponse = await ZOHO.CRM.CONNECTOR.invokeAPI("twiliophonenumbervalidatorbyupro.zohoworkdrive.getUserInfo", {});
  //     console.log("User Info:", userResponse);
  //     const userparsedResponse = JSON.parse(userResponse.response);
  //     const userId = userparsedResponse.data.id;

  //     if (!userId) throw new Error("User ID not found");

  //     // Step 2: Get Team Info using User ID
  //     const teamResponse = await ZOHO.CRM.CONNECTOR.invokeAPI("twiliophonenumbervalidatorbyupro.zohoworkdrive.getTeamInfo", { zuid: userId });
  //     console.log("Team Info:", teamResponse);
  //     const teamparsedResponse = JSON.parse(teamResponse.response);
  //     const teamId = teamparsedResponse.data[0].id;

  //     if (!teamId) throw new Error("Team ID not found");

  //     // Step 3: Get Team Member Info using Team ID
  //     const teamMemberResponse = await ZOHO.CRM.CONNECTOR.invokeAPI("twiliophonenumbervalidatorbyupro.zohoworkdrive.getTeamMemberInfo", { teamId: teamId });
  //     console.log("Team Member Info:", teamMemberResponse);
  //     const teamMemberparsedResponse = JSON.parse(teamMemberResponse.response);
  //     const teamMemberId = teamMemberparsedResponse.data.id;

  //     if (!teamMemberId) throw new Error("Team Member ID not found");

  //     // Step 4: Get Parent ID using Team Member ID
  //     const parentResponse = await ZOHO.CRM.CONNECTOR.invokeAPI("twiliophonenumbervalidatorbyupro.zohoworkdrive.getParentId", { teamMemberId: teamMemberId });
  //     console.log("Parent ID Info:", parentResponse);
  //     const parentparsedResponse = JSON.parse(parentResponse.response);
  //     const parentId = parentparsedResponse.data[0].id;
  //     parentIdRef.current = parentId;

  //     if (!parentId) throw new Error("Parent ID not found");

  //     return parentId;
  // } catch (error) {
  //     console.error("Error fetching Zoho WorkDrive data:", error);
  // }
  // }

  // const fetchZohoWorkDriveDetails = async () => {
    //   try {
  //     // const clientId = await ZOHO.CRM.API.getOrgVariable(
  //     //   "twiliophonenumbervalidatorbyupro__work_drive_clientId"
  //     // );
  //     // const clientSecret = await ZOHO.CRM.API.getOrgVariable(
  //     //   "twiliophonenumbervalidatorbyupro__work_drive_client_secret"
  //     // );
  //     // const aToken = await ZOHO.CRM.API.getOrgVariable(
  //     //   "twiliophonenumbervalidatorbyupro__work_drive_access_token"
  //     // );
  //     // const rToken = await ZOHO.CRM.API.getOrgVariable(
  //     //   "twiliophonenumbervalidatorbyupro__work_drive_refresh_token"
  //     // );
  //     const parent_i_d = await ZOHO.CRM.API.getOrgVariable(
  //       "twiliophonenumbervalidatorbyupro__parentId"
  //     );
  
  //     // clientIdRef.current = clientId.Success.Content || "";
  //     // clientSecretRef.current = clientSecret.Success.Content || "";
  //     // accessTokenRef.current = aToken.Success.Content || "";
  //     // refreshTokenRef.current = rToken.Success.Content || "";
  //     parentIdRef.current = parent_i_d.Success.Content || "";
  
  //     console.log("Fetched details:", {
  //       // clientId: clientIdRef.current,
  //       // clientSecret: clientSecretRef.current,
  //       // accessToken: accessTokenRef.current,
  //       // refreshToken: refreshTokenRef.current,
  //       parentId: parentIdRef.current,
  //     });
  //   } catch (error) {
  //     console.error("Error getting Zoho WorkDrive details", error);
  //     toast.error("Something went wrong. Please try again.");
  //   }
  // };

  // const upoladFile = async (file) => {
  //   try {
  //     if (!file) {
  //         console.error("No file selected for upload.");
  //         return;
  //     }

  //     // Extract file properties
  //     const fileName = file.name;
  //     const fileType = file.type;

  //     // Prepare request body
  //     var data = {
  //       "VARIABLES": {
  //           "file_name": fileName,
  //           "parent_id": parentIdRef.current, // REQUIRED: Folder ID
  //           "override-name-exist": "false" // Optional: Set to "true" to overwrite
  //       },
  //       "CONTENT_TYPE": "multipart",
  //       "PARTS": [
  //           {
  //               "headers": {
  //                   "Content-Type": "application/json"
  //               },
  //               "content": JSON.stringify({
  //                   "file_name": fileName,
  //                   "parent_id": parentIdRef.current,
  //                   "override-name-exist": "false"
  //               })
  //           },
  //           {
  //               "headers": {
  //                   "Content-Disposition": `form-data; name="content"; filename="${fileName}"`,
  //                   "Content-Type": file.type // Set actual file type
  //               },
  //               "content": file
  //           }
  //       ]
  //   };

  //     console.log("Uploading file:", data);

  //     // Call Zoho API Connector
  //     const response = await ZOHO.CRM.CONNECTOR.invokeAPI("twiliophonenumbervalidatorbyupro.zohoworkdrive.uploadfile", data);
      
  //     console.log("Upload Response:", response);
  //     return response;
  // } catch (error) {
  //   if(error.code === '403' && error.message === 'Authorization Exception'){
  //     const responeAuth = await connectorAuthorization()
  //     console.log('reponseAuth', responeAuth)
  //   }
  //     console.error("Error uploading file:", error);
  // }
  // }

  // Step 1: Redirect user to Zoho OAuth Authorization Page
  // const initiateZohoAuth = () => {
  //   console.log('client id', clientIdRef.current)
  //   const authUrl = `https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=${clientIdRef.current}&scope=WorkDrive.users.ALL,WorkDrive.files.ALL,WorkDrive.links.ALL,WorkDrive.team.ALL&redirect_uri=${REDIRECT_URI}&access_type=offline&prompt=consent`;
  //   // window.location.href = authUrl;
  //   const popup = window.open(authUrl, "_blank", "width=500,height=700");
  //   const interval = setInterval(() => {
  //     try {
  //       if (popup.closed) {
  //         clearInterval(interval);
  //         alert("Authorization process interrupted.");
  //       } else if (popup.location.href.includes("code")) {
  //         const code = new URL(popup.location.href).searchParams.get("code");
  //         console.log('get code from popup', code)
  //         fetchAccessToken(code);
  //         popup.close();
  //         clearInterval(interval);
  //       }
  //     } catch (e) {
  //       console.log("Cross-origin restriction", e)
  //     }
  //   }, 1000);
  // };

  // Step 2: Exchange Authorization Code for Access Token

  // useEffect(() => {
  //   console.log("useeffect code for url code.")
  //   const urlParams = new URLSearchParams(window.location.search);
  //   const code = urlParams.get("code"); // Extract the code from the URL
  
  //   if (code) {
  //     // If the authorization code is present, exchange it for an access token
  //     fetchAccessToken(code);
  //   }
  // }, []);

  //   const fetchAccessToken = async (code) => {
  //   try {
  //     const response = await axios.post(
  //       "https://accounts.zoho.com/oauth/v2/token",
  //       new URLSearchParams({
  //         code: code, // The authorization code received
  //         client_id: clientIdRef.current, // Your client ID from API Console
  //         client_secret: clientSecretRef.current, // Your client secret from API Console
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
  //     accessTokenRef.current = access_token
  //     refreshTokenRef.current = refresh_token
  //   } catch (error) {
  //     console.error("Error fetching access token:", error.response?.data || error);
  //     alert("Failed to fetch access token. Please try again.");
  //   }
  // };

  // Step 3: Upload File to Zoho WorkDrive

  // const uploadFileToZoho = async (file , token = accessTokenRef.current) => {
  //   const formData = new FormData();
  // formData.append("content", file);
  // formData.append("parent_id", parentIdRef.current);

  // console.log("Access token being used:", token);


  // try {
  //   const response = await axios.post(
  //     "https://127.0.0.1:5000/upload",
  //     formData,
  //     {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //         Authorization: `Zoho-oauthtoken ${token}`,
  //         parentId: parentIdRef.current,
  //       },
  //     }
  //   );

  //   if (parentIdRef.current !== response.data.parentID) {
  //     const data = {
  //       apiname: "twiliophonenumbervalidatorbyupro__parentId",
  //       value: response.data.parentID,
  //     };
  //     parentIdRef.current = response.data.parentID;
  //     await ZOHO.CRM.CONNECTOR.invokeAPI("crm.set", data);
  //   }

  //   setAttachmentUrl(response.data.permalink);
  //   setFileType(file.name.split(".").pop());
  //   } catch (error) {
  //     if (
  //       error.response?.status === 500 &&
  //       error.response?.data?.message === "Invalid OAuth token."
  //     ) {
  //       const newAccessToken = await refreshAccessToken();
  //       uploadFileToZoho(file , newAccessToken);
  //     } else if (
  //       error.response?.status === 400 &&
  //       error.response?.data?.message === "Parameter length more than permitted"
  //     ) {
  //       setShowError(true)
  //       toast.error("File name is too long. Please rename the file.");
  //     } else if (
  //       error.response?.status === 400 &&
  //       error.response?.data?.error === "No file uploaded"
  //     ) {
  //       setShowError(true)
  //       toast.error("Something went wrong. Please refresh the page.");
  //     } else {
  //       console.error("File upload failed:", error.response?.data || error);
  //       setShowError(true)
  //       toast.error("Failed to upload file. Please try again.");
  //     }
  //   }
  // };
  // const convertToBase64 = (file) => {
  //   return new Promise((resolve, reject) => {
  //     const reader = new FileReader();
  //     reader.readAsDataURL(file);
  //     reader.onload = () => resolve(reader.result.split(",")[1]); // Extract Base64
  //     reader.onerror = (error) => reject(error);
  //   });
  // };

  // const handleUpload = async (file) => {
  //   if (!file) {
  //     alert("Please select a file!");
  //     return;
  //   }

  //   const formData = new FormData();
  //   formData.append("file", file);
  //   formData.append("accountSid", accountSid);
  //   formData.append("authToken", authToken);

  //   try {
  //     const response = await fetch("https://127.0.0.1:5000/upload", {
  //       method: "POST",
  //       body: formData,
  //     });

  //     const data = await response.json();

  //     if (response.ok) {
  //       setAttachmentUrl(data.url); // Save the public URL for Twilio MediaUrl
  //       alert("File uploaded successfully!");
  //     } else {
  //       alert("File upload failed. Please try again.");
  //     }
  //   } catch (error) {
  //     console.error("Error uploading file:", error);
  //     alert("File upload failed.");
  //   }
  // };

 // const refreshAccessToken = async () => {
  //   try {
  //     const response = await axios.post(
  //       "https://127.0.0.1:5000/refresh-token",
  //       {
  //         refresh_token: refreshTokenRef.current,
  //         client_id: clientIdRef.current,
  //         client_secret: clientSecretRef.current,
  //       }
  //     );
  
  //     const { access_token } = response.data;
  
  //     accessTokenRef.current = access_token; // Update the ref
  
  //     const data = {
  //       apiname: "twiliophonenumbervalidatorbyupro__work_drive_access_token",
  //       value: access_token,
  //     };
  
  //     await ZOHO.CRM.CONNECTOR.invokeAPI("crm.set", data);
  //     console.log("Access token refreshed:", access_token);
  
  //     return access_token; // Return the new token
  //   } catch (error) {
  //     console.error("Error refreshing access token:", error);
  //     toast.error(
  //       "Failed to refresh Zoho WorkDrive access token. Please reauthorize."
  //     );
  //   }
  // };
