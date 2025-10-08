import { useEffect, useState, useReducer, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import "react-toastify/dist/ReactToastify.css";
import "./settings.scss";
import { twilioConfigReducer, initialTwilioConfig } from "../../ContextApi/twilioConfigReducer";
import {getConfiguration, getTwilioNumbers, saveConfiguration, validateAccount} from '../../ContextApi/twilioApis'
import AnimatedButton from './animateButton'
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import Typography from '@mui/material/Typography';
import { FiInfo } from "react-icons/fi";
import {
  Box,
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  styled,
  Skeleton,
} from "@mui/material";

// 💡 Style variables
const outterContainer = {
  width: "100%",
  height: "95vh",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#e3e3e3",
};

const containerStyle = {
  backgroundColor: "#FFFFFF",
  padding: "20px 30px",
  width: "497px",
  borderRadius: "15px",
  display: "flex",
  minHeight: "300px",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "space-between",
  gap: "20px",
};

const toggleGroupStyle = {
  display: "flex",
  backgroundColor: "#F4F4F4",
  borderRadius: "10px",
  justifyContent: "space-between",
  alignItems: "center",
  '&.MuiToggleButtonGroup-grouped.hover':{
    backgroundColor: "none",
  }
  // '&.MuiToggleButtonGroup-grouped':{ transition: "all 0.7s ease"}
};

const toggleButtonStyle = {
  flex: 1,
  fontWeight: 600,
  textTransform: "none",
  border: "none",
  color: "#333",
  '&.Mui-selected':{
    width: "169px",
    height: "35px",
    backgroundColor: "#0087E0",
    color: "white",
    borderRadius: "6px",
    padding: "7px",
    margin: "6px",
    transition: "all 0.7s ease",
                '& .Mui-selected:hover':{
                  backgroundColor: '#3f9cd3e8',
                }
              }
  
};

const inputFieldStyle = {
  width: "100%",
};

const buttonGroupStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: '20px'
};

const cancelButtonStyle = {
  backgroundColor: "#CBCBCB",
  color: "rgb(0, 0, 0)",
  textTransform: "none",
  width: "107px",
  padding: "8px 30px",
  boxShadow: "none",
  fontSize: "16px",
  "&:hover": {
    backgroundColor: "#bbb",
  },
};

const nextButtonStyle = {
  background: "#0087E0",
  color: "white",
  textTransform: "none",
  width: "107px",
  padding: "8px 30px",
  boxShadow: "none",
  fontSize: "16px",
  "&:hover": {
    backgroundColor: "#6962622e",
  },
};

const buttonContainer = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "20px",
};

const tableConatiner = {
  width: "auto",
  border: "1px solid #E0E0E0",
  padding: "0px 20px",
  borderRadius: "4px",
  maxHeight: "195px",
  overflowY: "scroll",
  scrollbarWidth: "thin",
  transition: "all 0.7s ease-in-out",
};

const confirmButton = {
   background: "#fb1313",
  color: "white",
  textTransform: "none",
  width: "107px",
  padding: "8px 30px",
  boxShadow: "none",
  fontSize: "16px",
  "&:hover": {
    backgroundColor: "#c01616",
  },
}

const statusBoxStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "40px",
  transition: "all 0.4s ease",
  gap: "10px",
};

const skeletonStyle = {
  width: '497px',
        padding: '32px 40px',
        borderRadius: '15px',
        backgroundColor: '#909090',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '260px'
}

const Settings = ({close, page}) => {
  const [twilioConfig, dispatchTwilioConfig] = useReducer( twilioConfigReducer, initialTwilioConfig);
  const [TempState, setTempState] = useState({ sid: "", token: "" });
  const [invaildCredenital, setInvalidCredential] = useState({ sid: false, token: false,});
  const [tab, setTab] = useState("account");
  const [buttonState, setButtonState] = useState("Next")
  const [loading, setShowLoading] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle"); 
  const [userId, setUserId] = useState("");
  const catalystRowId = useRef("");

  useEffect(() => {
    ZOHO.embeddedApp.on("PageLoad", fetchTwilioCredentials);
    ZOHO.embeddedApp.init().then(() => {});
  }, []);

  useEffect(() => {
  fetchTwilioCredentials();
}, [page]);

  //helper function for fetching Credentials
  const fetchTwilioCredentials = async (state = true) => {
    try {
      setShowLoading(state);

      const userResp = await ZOHO.CRM.CONFIG.getCurrentUser();
      const userId = userResp.users[0].id;
      setUserId(userId)

      const status = await ZOHO.CRM.API.getOrgVariable("testankitext__Auto_Validation");
      const validationStatus = status.Success?.Content || "";

      const {success, data} = await getConfiguration(userId);

      const {
        rowId = "",
        accountSid = "",
        authToken = "",
        messagingServiceSid = { friendlyName: "", Sid: "" },
        conversationServiceSid = { friendlyName: "", Sid: "" },
      } = data || {};

      console.log('rowId', rowId)
      catalystRowId.current = rowId;
      dispatchTwilioConfig({
        type: "SET_CONFIG",
        payload: {
          userID: userId,
          twilioSID: accountSid,
          twilioToken: authToken,
          autoValidationChecked: validationStatus === 'ON' ? true : false,
          messagingServiceSid,
          conversationServiceSid,
        },
      });

      setTempState({ sid: accountSid, token: authToken });

      return {
        accountSid,
        authToken,
      };
    } catch (error) {
      console.error("Error fetching Twilio credentials:", error);
      return {};
    } finally {
      setShowLoading(false);
    }
  };

   //helper function for fetching Phone Numbers
  const fetchTwilioPhoneNumbers = async () => {
    try {
      const orgVarResp = await ZOHO.CRM.API.getOrgVariable("testankitext__Current_Twilio_Number");
      const numberContent = orgVarResp.Success?.Content || "";
      const {success, count, numbers} = await getTwilioNumbers(userId || twilioConfig.userID)

      if (!success) {
        return { valid: false };
      }

      const fetchedNumbers = numbers || [];

      // ✅ Filter SMS-capable numbers
      const smsCapableNumbers = fetchedNumbers.filter(
        (num) => num.smsEnabled === true
      );

      // ✅ Format for UI state
      const numberList = smsCapableNumbers.map((num) => ({
        number: num.phoneNumber,
        toggle: num.phoneNumber === numberContent,
        friendlyName: num.friendlyName,
      }));

      dispatchTwilioConfig({
        type: "SET_CONFIG",
        payload: {
          currentTwilioNumber: numberContent,
          twilioNumber: numberList,
        },
      });
    } catch (error) {
      console.error("Error fetching Twilio phone numbers:", error);
      return { success: false, error };
    }
  };

  //helper function to verify account
  const validateTwilioAccount = async () => {
    setButtonState("Verifying");

    if (!TempState.sid || !TempState.token) {
      setTempState({ sid: "", token: "" });
      return { valid: false };
    }

    try {
      const {success, message, status, messagingService, conversationService} = await validateAccount(TempState.sid, TempState.token);

      if(!success && !message){
        return null;
      }

      dispatchTwilioConfig({
        type: "SET_CONFIG",
        payload: {
          twilioSID: TempState.sid,
          twilioToken: TempState.token,
          messagingServiceSid: messagingService,
          conversationServiceSid: conversationService,
        },
      });

      let result = {
        twilioSID: TempState.sid,
        twilioToken: TempState.token,
        messagingServiceSid: messagingService,
        conversationServiceSid: conversationService,
      };
      await ZOHO.CRM.CONNECTOR.invokeAPI("crm.set", {
        apiname: "testankitext__Current_Twilio_Number",
        value: '',
      });
      setButtonState("Successfull");
      return { valid: status, data: result };
    } catch (error) {
      const {success, message} = error
      if (!success && message?.includes("Invalid Account SID")) {
        setInvalidCredential({ sid: true, token: false });
        handleTwilioSID("");
      } else if (!success && message?.includes("Invalid Auth Token")){
        setInvalidCredential({ sid: false, token: true });
        handleTwilioToken("");
      } else {
        console.log('Error Validating Account', error)
        toast.error("Something went wrong while verifying credentials.");
      }
      setButtonState('Next')
      return { valid: false };
    }
  };

  //helper function to save data to Zoho
  const saveDataToZoho = async () => {
    setSaveStatus('loading')
    if(!twilioConfig.twilioSID, !twilioConfig.twilioToken, !twilioConfig.currentTwilioNumber){
      setSaveStatus('error')
      return 
    }
    const data = [
      {
        apiname: "testankitext__Twilio_SID",
        value: twilioConfig.twilioSID,
      },
      {
        apiname: "testankitext__Twilio_Token",
        value: twilioConfig.twilioToken,
      },
      {
        apiname: "testankitext__Current_Twilio_Number",
        value: twilioConfig.currentTwilioNumber,
      },
      {
        apiname: "testankitext__Twilio_Token_Status",
        value:
          invaildCredenital.sid || invaildCredenital.token
            ? "INVALID Sid/Token"
            : "VALID",
      },
      {
        apiname: "testankitext__Unique_Row_Id",
        value: catalystRowId.current,
      },
      {
        apiname: "testankitext__Auto_Validation",
        value: !twilioConfig.autoValidationChecked? "OFF" : "ON",
      }
    ];
    
    try {
      for (const item of data) {
        const response = await ZOHO.CRM.CONNECTOR.invokeAPI("crm.set", item);
        const result =
          typeof response === "string" ? JSON.parse(response) : response;
        // if (String(result.status_code) !== "200") {
        //   throw new Error(`Zoho save failed for ${item.apiname}`);
        // }
      }
      setSaveStatus('success')
      return { success: true };
    } catch (error) {
      console.log("Error in saving data", error);
      setSaveStatus('error')
      return { success: false };
    }
    finally{
      setTimeout(() => {
        setSaveStatus('idle')
      }, 1000)
    }
  };
  //helper function to save data to Catalyst
  const saveDataToCatalyst = async (data) => {
    try {
      const {success, message, rowId} = await saveConfiguration(userId || twilioConfig.userID, data) 
      catalystRowId.current = rowId

      fetchTwilioCredentials(false); // Refresh UI
      return { success: true };
    } catch (error) {
      console.error("Error saving credentials:", error);
      return { success: false };
    }
  };

  //UI helper functions
  const handleTwilioSID = (sid) => {
    setTempState((prev) => ({
      ...prev,
      sid: sid.trim(),
    }));
  };

  const handleTwilioToken = (token) => {
    setTempState((prev) => ({
      ...prev,
      token: token.trim(),
    }));
  };

  const handleTabChange = async (newTab) => {
  // 1. Block tab change if required SID/TOKEN is empty
  const isTempEmpty = !TempState.sid || !TempState.token;
  const isTwilioEmpty = !twilioConfig.twilioSID || !twilioConfig.twilioToken;

  if (newTab === "phone" && isTempEmpty && isTwilioEmpty) {
    toast.warn("SID and Token can't be null");
    return;
  }

  setInvalidCredential({ sid: false, token: false });

  // 2. First-time setup (no saved SID/Token)
  if (newTab === "phone" && isTwilioEmpty && !isTempEmpty) {
    setButtonState("Verifying");
    const valid = await validateTwilioAccount();
    if (valid.valid) {
      await saveDataToCatalyst(valid.data);
      await fetchTwilioPhoneNumbers();
      setButtonState("Next");
      setTab(newTab);
    } else {
      setButtonState("Next");
    }
    return;
  }

  // 3. If SID/TOKEN changed — ask confirmation
  const sidChanged = TempState.sid !== twilioConfig.twilioSID;
  const tokenChanged = TempState.token !== twilioConfig.twilioToken;

  if (newTab === "phone" && (sidChanged || tokenChanged)) {
    setPendingTabChange(newTab);
    setOpenConfirmModal(true); // show modal
    return;
  }

  // 4. If SID/TOKEN unchanged but number list empty — fetch numbers
  if (newTab === "phone" && twilioConfig.twilioNumber.length === 0) {
    await fetchTwilioPhoneNumbers();
  }

  // 5. Default tab switch
  setTab(newTab);
};

  const handleConfirm = async () => {
  setOpenConfirmModal(false); // Close modal

  const valid = await validateTwilioAccount();
  if (valid.valid) {
    await saveDataToCatalyst(valid.data);
    await fetchTwilioPhoneNumbers();
    setTimeout(() => {
      setTab(pendingTabChange); // Use stored tab change value
      setButtonState('Next');
      setPendingTabChange(null); // Reset
    }, 500);
  } else {
    setPendingTabChange(null); // Reset if failed
    setButtonState('Next');
  }
};

  const handleCancelConfirm = () => {
    setOpenConfirmModal(false);
    setPendingTabChange(null); // Reset
    setTempState({ sid: twilioConfig.twilioSID, token: twilioConfig.twilioToken });
  };

  const handleToggle = (selectedNumber) => {
    const updatedNumbers = twilioConfig.twilioNumber.map((num) => ({
      ...num,
      toggle: num.number === selectedNumber, // only one toggle ON
    }));
    setSaveStatus("idle")
    dispatchTwilioConfig({
      type: "SET_CONFIG",
      payload: {
        twilioNumber: updatedNumbers,
        currentTwilioNumber: selectedNumber,
      },
    });
  };

  const handleCancleClick = () => {
    if(!TempState.sid || !TempState.token){
      return;
    }
    else{
      close();
    }
  }

  const handleAutoValiation = () => {
    dispatchTwilioConfig({
      type: "SET_CONFIG",
      payload: {
        autoValidationChecked: !twilioConfig.autoValidationChecked,
      },
    })
  }

  return (
    <Box style={outterContainer}>
      {loading ? (

        // Loading Skeleton
        <Box style={skeletonStyle}>
          <Skeleton variant="rounded" width="90%" height={40} />

          <Skeleton variant="rounded" width="90%" height={35} />
          <Skeleton variant="rounded" width="90%" height={35} />

          <Skeleton variant="rounded" width={80} height={36} />
        </Box>
      ) :(

        // Main Container
        <Box style={containerStyle}>

          {/* Container header for switching tabs*/}
          <ToggleButtonGroup value={tab} exclusive 
          sx={{
            display: "flex",
            backgroundColor: "#F4F4F4",
            borderRadius: "10px",
            padding: '8px',
            justifyContent: "space-between",
            alignItems: "center",
            "& .MuiToggleButtonGroup-grouped": {
              border: "none",
              "&:not(:last-of-type)": {
                borderRight: "1px solid transparent",
              },
            },
            "& .MuiToggleButtonGroup-lastButton": {
              borderTopLeftRadius: "8px",
              borderBottomLeftRadius: "8px",
            },
            "& .MuiToggleButtonGroup-firstButton": {
              borderTopRightRadius: "8px",
              borderBottomRightRadius: "8px",
            },
          }}>

            {/* Toggle button for account tab */}
            <ToggleButton
              disabled={buttonState !== "Next"}
              value="account"
              onChange={() => handleTabChange("account")}
              sx={{
                flex: 1,
                fontWeight: 600,
                textTransform: "none",
                border: "none",
                color: "#333",
                borderRadius: "10px",
                padding:'5px',
                transition: "background-color 0.4s ease, color 0.4s ease",
                "&.Mui-selected": {
                  backgroundColor: "#0087E0",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#3f9cd3e8",
                  },
                },
              }}
            >
              Account
            </ToggleButton>

            {/* Toggle button for phone tab */}
            <ToggleButton
              disabled={buttonState !== "Next"}
              value="phone"
              onChange={() => handleTabChange("phone")}
              sx={{
                flex: 1,
                fontWeight: 600,
                textTransform: "none",
                border: "none",
                color: "#333",
                borderRadius: "10px",
                padding:'5px',
                transition: "background-color 0.4s ease, color 0.4s ease",
                "&.Mui-selected": {
                  backgroundColor: "#0087E0",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#3f9cd3e8",
                  },
                },
              }}
            >
              Phone Numbers
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Container Content/ Tab */}
          <Box sx={{ position: "relative", width: "100%", minHeight: "230px", overflow: "hidden" }}>

            {/* Account Tab */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-around',
                position: 'absolute',
                height: '100%',
                width: "100%",
                top: 0,
                transform: tab === "account" ? "translateX(0%)" : "translateX(-100%)",
                transition: "transform 0.5s ease-in-out",
              }}
            >
              {/* Account Sid Input */}
              <TextField required
                fullWidth
                label="Account SID"
                variant="outlined"
                value={TempState.sid}
                onChange={(e) => handleTwilioSID(e.target.value)}
                style={inputFieldStyle}
                error={invaildCredenital.sid}
                helperText={invaildCredenital.sid ? "Invalid Account SID" : ""}
                sx={{
                  "& .MuiFormHelperText-root": {
                    position: "absolute",
                    top: "-25px",
                    right: "0px",
                    fontSize: "0.85rem",
                  },
                }}
              />

              {/* Account Token Input */}
              <TextField required
                fullWidth
                label="Account Token"
                variant="outlined"
                type="password"
                value={TempState.token}
                onChange={(e) => handleTwilioToken(e.target.value)}
                style={inputFieldStyle}
                error={invaildCredenital.token}
                helperText={invaildCredenital.token ? "Invalid Auth Token" : ""}
                sx={{
                  "& .MuiFormHelperText-root": {
                    position: "absolute",
                    top: "-25px",
                    right: "0px",
                    fontSize: "0.85rem",
                  },
                }}
              />

              {/* Auto Validation Button */}
              <div className="autoValidationBox">
                <div className="autoValidationTitleBox">
                <p>Auto Validation</p>
                <Tooltip title="Auto validated phone/mobile numbers of Leads/Contacts">
                  <Box component="span" sx={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                    <FiInfo size={14} />
                  </Box>
                </Tooltip>
                </div>
                <Tooltip title="Auto validated phone/mobile numbers of Leads/Contacts">
                <Switch
                  color="primary"
                  checked={twilioConfig.autoValidationChecked}
                  onChange={handleAutoValiation}
                />
                </Tooltip>
              </div>

              {/* Confirm box if sid & token change */}
              {
                openConfirmModal && 
                <p style={{width: '100%', color: 'red', fontSize:'14px', fontWeight:'400', textAlign: 'center', margin:'0', padding:'0'}}>
                  Changing SID or Token will reset your configuration. Are you sure you want to proceed?
                </p>
              }

              {/* Button Container */}
              <Box style={buttonGroupStyle}>
                {
                  openConfirmModal ? 
                  <>
                  <Button style={confirmButton} onClick={handleConfirm}>Confirm</Button> 
                  <Button style={cancelButtonStyle} onClick={handleCancelConfirm}>Cancel</Button> 
                  </> :

                  // Progresser
                  <AnimatedButton buttonState={buttonState} onClick={() => handleTabChange("phone")} />
                }
              </Box>
            </Box>

            {/* Phone Numbers Tab */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'absolute',
                gap:'10px',
                height: '100%',
                width: "100%",
                top: 0,
                transform: tab === "phone" ? "translateX(0%)" : "translateX(100%)",
                transition: "transform 0.5s ease-in-out",
              }}
            >
              <TableContainer elevation={0} style={tableConatiner}>
                {/* Phone Number Table */}
                <Table>

                  {/* Table Header */}
                  <TableHead>
                    <TableRow>
                      <TableCell style={{ color: "#424242", fontWeight: 600 }}>
                        Friendly Name
                      </TableCell>
                      <TableCell style={{ color: "#424242", fontWeight: 600 }}>
                        Twilio Number
                      </TableCell>
                      <TableCell align="center" style={{ color: "#424242", fontWeight: 600 }}>
                        Default
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  {/* Table Body */}
                  <TableBody>
                    {twilioConfig.twilioNumber.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell style={{ color: "#757575" }}>
                          {row.friendlyName}
                        </TableCell>
                        <TableCell style={{ color: "#757575" }}>
                          {row.number}
                        </TableCell>
                        <TableCell align="center">
                          <Switch
                            color="primary"
                            checked={row.toggle === true}
                            onChange={() => handleToggle(row.number)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Button Container */}
              <Box sx={buttonContainer}>
                {saveStatus === "idle" && (
                  <>

                    {/* Button for saving to zoho */}
                    <Button
                      onClick={async () => {
                        setSaveStatus("loading");
                        const result = await saveDataToZoho();
                        if (result.success) {
                          setSaveStatus("success");
                        } else {
                          setSaveStatus("error");
                        }
                        setTimeout(() => setSaveStatus("idle"), 2000);
                      }}
                      style={nextButtonStyle}
                    >
                      Save
                    </Button>

                    {/* Back to account tab */}
                    <Button
                      onClick={() => setTab("account")}
                      style={cancelButtonStyle}
                    >
                      Back
                    </Button>
                  
                  </>
                )}

                {/* Progresser */}
                {saveStatus === "loading" && (
                  <Box sx={statusBoxStyle}>
                    <CircularProgress size={24} />
                  </Box>
                )}

                {/* Saved Status */}
                {saveStatus === "success" && (
                  <Box sx={statusBoxStyle}>
                    <CheckCircleIcon sx={{ color: "green", mr: 1 }} />
                    <Typography sx={{ fontWeight: 600 }}>Saved Successfully</Typography>
                  </Box>
                )}

                {/* Warning Status */}
                {saveStatus === "error" && (
                  <Box sx={statusBoxStyle}>
                    <ErrorIcon sx={{ color: "red", mr: 1 }} />
                    <Typography sx={{ fontWeight: 600 }}>{!twilioConfig.currentTwilioNumber ? "Choose a default number First" : "Saved Failed"}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
      <ToastContainer />

      {/* Back button to chat component */}
      {
        (page === "chatComponent" && !loading ) && (
          <Tooltip title="Back to Chat">
            <button onClick={handleCancleClick} className="backToChatButton">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 34.8333C27.7084 34.8333 34.8334 27.7083 34.8334 19C34.8334 10.2917 27.7084 3.16667 19 3.16667C10.2917 3.16667 3.16669 10.2917 3.16669 19C3.16669 27.7083 10.2917 34.8333 19 34.8333Z" fill="black" fill-opacity="0.5"/>
              <path d="M14.5192 23.4808L23.4808 14.5192" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M23.4808 23.4808L14.5192 14.5192" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </Tooltip>
        )
      }
    </Box>
  );
};

export default Settings;