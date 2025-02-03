import React, { useEffect, useState } from "react";
import "./settings.scss";
import { toast, ToastContainer } from "react-toastify";
import CircularProgress from '@mui/material/CircularProgress';
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TablePagination,
  Switch,
  Box, styled, TextField
} from "@mui/material";
import Tooltip from '@mui/material/Tooltip'
import { IoIosAddCircleOutline } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import neo1 from '../utility/C-HM Conseil .jpeg'
import neo2 from '../utility/C-HM Conseil - Awwwards Honorable Mention.jpeg'
import { MdOutlineDone } from "react-icons/md";

const CustomTextField = styled(TextField)({
  width: '100%',
  background: '#faf8f8d1', // White background
  borderRadius: '10px', // Rounded corners
  margin: '0px',
  boxShadow: 'inset 1px 1px 5px rgba(0, 0, 0, 0.2), inset -4px -5px 3px 0px #FFFFFF', // Neomorphic shadows
  '&MuiInputLabel-root':{
    color: '#898686a6',
    transform: "translate(18px, 11px) scale(1)", // Position the label
    fontWeight: "bold", // Make the label bold
    transition: 'smooth 0.3s',
  },
  "& .MuiInputLabel-root.Mui-focused": {
  color: "#42444aa1", // Change label color when focused (darker blue)
  transform: "translate(13px, -14px) scale(1)",
},
  '& .MuiOutlinedInput-root': {
    '& MuiInputBase-input':{
      padding: '10.5px 14px'
    },
    '& fieldset': {
      border: 'none', // Remove default border
    },
    '&:hover fieldset': {
      border: 'none', // Remove border on hover
    },
    '&.Mui-focused fieldset': {
      border: 'none', // Remove border when focused
    },
    '&.MuiInputBase-input':{
      padding: '12px 14px'
    }
  },
});
const NeomorphicTableContainer = styled(TableContainer)({
  background: "#f6f4f4",
  borderRadius: "15px",
  boxShadow: "inset 2px 1px 11px #bebebe, inset -6px -8px 5px #ffffff",
  margin: "0px",
  width: "100%",
  height: "181px", // Fixed table height
  overflow: "hidden", // Scrollable table content
});
const CustomTableCell = styled(TableCell)({
  '&.MuiTableCell-head':{
     padding: '5px 16px'
  },
  '&.MuiTableCell-root': {
    padding: '5px 16px',
    fontSize: '0.7rem'
  }
})

const NeomorphicTableRow = styled(TableRow)(({ isSelected }) => ({
  cursor: "pointer",
  transition: 'smooth 0.5s',
  "&:hover": {
    boxShadow: "4px 4px 8px rgba(190, 190, 190, 0.69), -8px -8px 15px #ffffff",
    position: "relative",
  },
}));

const AddButton = styled(IconButton)({
  background: "#f6f4f4",
  boxShadow: "-2px -4px 8px #fff, 2px 4px 7px #cccccc",
  color: "#9e9e9e",
  borderRadius: "8px",
  margin: "0 10px",
  transition: '0.4s',
  padding: '5px 10px',
  fontSize: '12px',
  "&:hover": {
    boxShadow: "rgb(255, 255, 255) -1px -1px 4px inset, rgb(204, 204, 204) 3px 3px 3px inset",
    background: '#f6f4f4'
  },
});


const Settings = () => {
  const [twilioSID, setTwilioSID] = useState("");
  const [twiliotoken, setTwilioToken] = useState("");
  const [twilioPhoneNumbers, setTwilioPhoneNumbers] = useState([]);
  const [currentTwilioNumber, setCurrentTwilioNumber] = useState("");
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(3);
  const [isEditing, setIsEditing] = useState(false);
  const [newTwilioField, setNewTwilioField] = useState({name: '', number: ''})
  const [showLoader, setShowLoader] = useState(false);
  const [invaildSid, setInvalidSid] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);
  const [fetchNumber, setFetchNumber] = useState([])

  useEffect(() => {
    ZOHO.embeddedApp.on("PageLoad", fetchTwilioCredentials);
    ZOHO.embeddedApp.init().then(() => {});
  }, []);

  const fetchTwilioCredentials = async () => {
    try {
      const twilioSID = await ZOHO.CRM.API.getOrgVariable("twiliophonenumbervalidatorbyupro__Twilio_SID");
      const twilioToken = await ZOHO.CRM.API.getOrgVariable("twiliophonenumbervalidatorbyupro__Twilio_Token");
      const currentTwilioNumber = await ZOHO.CRM.API.getOrgVariable("twiliophonenumbervalidatorbyupro__Current_Twilio_Number");
      const twilioPhoneNumbers = await ZOHO.CRM.API.getOrgVariable("twiliophonenumbervalidatorbyupro__Phone_Numbers");
      
      // Parse the responses if necessary (assuming Success.Content contains the value)
      const sidContent = twilioSID.Success.Content;
      const tokenContent = twilioToken.Success.Content;
      const numberContent = currentTwilioNumber.Success.Content;
      const phoneNumbers = JSON.parse(twilioPhoneNumbers.Success.Content);
  
      setTwilioSID(sidContent)
      setTwilioToken(tokenContent)
      setCurrentTwilioNumber(numberContent)
      setTwilioPhoneNumbers(phoneNumbers)
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
      const fetchTwilioPhoneNumbers = async (accountSid, authToken) => {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`;
      
        try {
          const response = await fetch(url, {
            method: "GET",
            headers: {
              "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`)
            }
          });
      
          if (response.ok) {
            const data = await response.json();
            console.log('twilio phone number',data)
            const phoneNumbers = data.incoming_phone_numbers.map(num => num.phone_number);
            setFetchNumber(phoneNumbers)
            return { success: true, numbers: data.incoming_phone_numbers };
          } else {
            const errorData = await response.json();
            console.error("❌ Failed to fetch Twilio phone numbers:", errorData);
            return { success: false, error: errorData };
          }
        } catch (error) {
          console.error("⚠️ Error fetching Twilio phone numbers:", error);
          return { success: false, error };
        }
      };
      if(twilioSID && twiliotoken){
      fetchTwilioPhoneNumbers(twilioSID, twiliotoken);
      }
  },[twilioSID, twiliotoken])
  
  const verifyTwilioCredentials = async (accountSid, authToken) => {
    try {
      const response = await fetch("https://127.0.0.1:5000/verify-twilio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ accountSid, authToken })
      });
  
      const data = await response.json();
  
      if (data.valid) {
        console.log("✅ Twilio Credentials Verified Successfully:", data);
        return { valid: true, data };
      } else {
        console.error("❌ Invalid Twilio Credentials:", data.error);
        return { valid: false, error: data.error };
      }
    } catch (error) {
      console.error("⚠️ Error Verifying Twilio Credentials:", error);
      return { valid: false, error };
    }
  };

  const saveCustomPropertiesOfTwilio = async () => {
    setShowLoader(true)
    const twilioVerification = await verifyTwilioCredentials(twilioSID, twiliotoken);
  if (!twilioVerification.valid) {
    setShowLoader(false);

    // Check if error is related to SID or Token
    if(twilioVerification.error.code === 20003){
      if (twilioVerification.error.message === "Authentication Error - invalid username") {
        setInvalidSid(true);
        toast.error("Invalid Twilio SID. Please check and try again.");
      }
      if (twilioVerification.error.message === "Authenticate") {
        setInvalidToken(true);
        toast.error("Invalid Twilio Auth Token. Please check and try again.");
      } 
    }
    else {
      toast.error("Twilio Credentials Verification Failed.");
    }
    
    return; // **🚫 Stop execution if verification fails**
  }
  setInvalidSid(false)
  setInvalidToken(false)
    const data = [
      { apiname: "twiliophonenumbervalidatorbyupro__Twilio_SID", value: twilioSID },
      { apiname: "twiliophonenumbervalidatorbyupro__Twilio_Token", value: twiliotoken },
      { apiname: "twiliophonenumbervalidatorbyupro__Phone_Numbers", value: twilioPhoneNumbers },
      { apiname: "twiliophonenumbervalidatorbyupro__Current_Twilio_Number", value: currentTwilioNumber }
    ];
  
    try {
      for (const item of data) {
        const response = await ZOHO.CRM.CONNECTOR.invokeAPI("crm.set", item );
        const parsedData = JSON.parse(response);
        if(parsedData.status_code){
          setShowLoader(false)
        }
        
      }
      toast.success('Twilio Credintials saved sucessfully.')
    } catch (error) {
      console.log("error", error);
      toast.error('Failed to save credinitals. Please try again later.')
    }
  };

  // Handler to add a new phone number

  const handleTwilioSID = (sid) => {
    setTwilioSID(sid);
  };

  const handleTwilioToken = (token) => {
    setTwilioToken(token);
  };

  const handleToggle = (selectedRow) => {
    // Update the currentTwilioNumber with the selected number
    setCurrentTwilioNumber(selectedRow.number);
  
    // Move the selected row to the top and unselect others
    const updatedRows = twilioPhoneNumbers.map((row) => ({
      ...row,
      toggle: row.number === selectedRow.number,
    }));
  
    const selectedRowData = updatedRows.find((row) => row.number === selectedRow.number);
  
    setTwilioPhoneNumbers([
      selectedRowData,
      ...updatedRows.filter((row) => row.number !== selectedRow.number),
    ]);
  };

  const handleDelete = async (rowIndex) => {
    const updatedRows = twilioPhoneNumbers.filter((_, index) => index !== rowIndex);
  
    setTwilioPhoneNumbers(updatedRows);
  
    // Update the changes in Zoho
    const data = { apiname: "twiliophonenumbervalidatorbyupro__Phone_Numbers", value: updatedRows };
    try {
      const response = await ZOHO.CRM.CONNECTOR.invokeAPI("crm.set", data);
      const parsedResponse = JSON.parse(response);
      if (parsedResponse.status_code === "200") {
        toast.success("Number deleted successfully.");
      } else {
        console.error("Error in response:", parsedResponse);
        toast.error("Failed to delete the number. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting row:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleAddRow = () => {
    const newRow = { friendlyName: newTwilioField.name, number: newTwilioField.number };
    setTwilioPhoneNumbers([newRow, ...twilioPhoneNumbers]);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTwilioField((prev) => ({ ...prev, [name]: value }));
  }

  const handleSaveFeild = () => {
    if(!newTwilioField.name || !newTwilioField.number){
      toast.warning('Both field are required.')
      return;
    }
    handleAddRow()
    setNewTwilioField({name:'', number:''})
    setIsEditing(false)
  }
  return (
    <Box className="settingsContainer">
      <div className='neomorphic-container-2'>
      <img src={neo2} alt="neo-2" />
      </div>
      <div className='neomorphic-container-1'>
      <img src={neo1} alt="neo-1" />
      </div>
      <Box className='innerContainer'>
      <div className='inputContainer'>
        <CustomTextField id="outlined-basic" label="Account SID" variant="outlined" sx={{border: invaildSid ? '1px solid red' : ""}} value={twilioSID} onChange={(e) => handleTwilioSID(e.target.value)}/>
        <CustomTextField id="outlined-basic" label="Account Token" type="password" variant="outlined" sx={{boder: invalidToken ? '1px solid red' : ""}} value={twiliotoken} onChange={(e) => handleTwilioToken(e.target.value)}/>
      </div>
        <div className='neomorphic-table'>
      <NeomorphicTableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <CustomTableCell sx={{fontWeight: 'bold'}}>Friendly Name</CustomTableCell>
              <CustomTableCell sx={{fontWeight: 'bold'}}>Twilio Number</CustomTableCell>
              <CustomTableCell align="center" sx={{fontWeight: 'bold'}}>Set as Default</CustomTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
  {twilioPhoneNumbers
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    .map((row, index) => (
      <NeomorphicTableRow
        key={index}
        isSelected={row.number === currentTwilioNumber}
      >
        <CustomTableCell>
          {row.friendlyName ? (
            row.friendlyName
          ) : (
            <TextField
  placeholder="Enter Friendly Name"
  size="small"
  value={row.friendlyName}
  // onChange={(e) => {
  //   const updatedRows = [...twilioPhoneNumbers];
  //   updatedRows[index] = { ...row, friendlyName: e.target.value };
  //   setTwilioPhoneNumbers(updatedRows);
  // }}
/>
          )}
        </CustomTableCell>
        <CustomTableCell>
          {row.number ? (
            row.number
          ) : (
            <TextField
              placeholder="Enter Number"
              size="small"
              value={row.number || ""}
  // onChange={(e) => {
  //   const updatedRows = [...twilioPhoneNumbers];
  //   updatedRows[index] = { ...row, number: e.target.value };
  //   setTwilioPhoneNumbers(updatedRows);
  // }}
            />
          )}
        </CustomTableCell>
        <CustomTableCell align="center">
          <Tooltip title='Set as default Number'>
          <Switch
            checked={row.number === currentTwilioNumber}
            onChange={() => handleToggle(row)}
          />
          </Tooltip>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(index);
            }}
            className="deleteButton"
          >
            <MdDelete />
          </button>
        </CustomTableCell>
      </NeomorphicTableRow>
    ))}
</TableBody>

        </Table>
      </NeomorphicTableContainer>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0px" }}>
        <TablePagination
          rowsPerPageOptions={[4]}
          component="div"
          count={twilioPhoneNumbers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{overflow:'hidden'
          }}
        />
         <Tooltip title={isEditing ? "Cancel adding": "Add new number"}>
        <AddButton onClick={() => setIsEditing(!isEditing)}>
          {!isEditing ? "Add" : "Cancel"}
        </AddButton>
         </Tooltip>
        {
          isEditing && (
            <motion.div
  className="newEditField"
  initial={{ x: -300, opacity: 0 }}
  animate={{ x: isEditing ? 0 : -300, opacity: isEditing ? 1 : 0 }}
  transition={{ duration: 1, ease: "easeInOut" }}
>
  <input 
  required
    placeholder="Friendly Name" 
    type="text" 
    name="name" 
    value={newTwilioField.name} 
    onChange={handleInputChange} 
  />
  <select
          required
          name="number"
          value={newTwilioField.number}
          onChange={handleInputChange }
        >
          {fetchNumber.map((num , index) => (
            <option key={index} value={num}>
              {num}
            </option>
          ))}
        </select>
  <Tooltip title="Save">
    <button onClick={handleSaveFeild}>
      <MdOutlineDone />
    </button>
  </Tooltip>
</motion.div>
            // <div className="newEditField">
            //   <input placeholder="Friendly Name" type="text" name='name' value={newTwilioField.name} onChange={handleInputChange}/>
            //   <input placeholder="Twilio Number"type="text" name='number' value={newTwilioField.number} onChange={handleInputChange}/>
            //   <Tooltip title="Save">
            //   <button onClick={handleSaveFeild}><MdOutlineDone /></button>
            //   </Tooltip>
            // </div>
          )
        }
      </div>
      <div className='saveButton'>
        <button onClick={saveCustomPropertiesOfTwilio}>
          {
            showLoader ? <CircularProgress size={12}/> : 'Save'
          }
        </button>
      </div>

    </div>
      </Box>
      <div className='neomorphic-text'>
        <span>TWILIO</span>
        <div className='neomorphic-container-4'></div>
      </div>
      <ToastContainer/>
    </Box>
  );
};

export default Settings;
