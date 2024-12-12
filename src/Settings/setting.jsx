import React, { useEffect, useState } from "react";
import { CiCircleChevUp } from "react-icons/ci";
import { IoMdAddCircle } from "react-icons/io";
import { MdOutlineDelete } from "react-icons/md";
import "./settings.scss";
import DropAnimation from "../DropAnimation/dropAnimation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal, Box } from "@mui/material";


const Settings = () => {
  const [twilioSID, setTwilioSID] = useState("");
  const [twiliotoken, setTwilioToken] = useState("");
  const [twilioPhoneNumbers, setTwilioPhoneNumbers] = useState([]);
  const [currentTwilioNumber, setCurrentTwilioNumber] = useState("");
  const [newNumber, setNewNumber] = useState({ friendlyName: "", number: ""});
  const [showDropdown, setShowDropdown] = useState(false);
  const [ addNumber , setAddNumber] = useState(false);

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
      console.log('PhoneNumber', phoneNumbers)
  
      setTwilioSID(sidContent)
      setTwilioToken(tokenContent)
      setCurrentTwilioNumber(numberContent)
      setTwilioPhoneNumbers(phoneNumbers)
    } catch (error) {
      console.error("Error:", error);
    }
  };
  

  const saveCustomPropertiesOfTwilio = async () => {
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

  const handleDropDown = () => {
    setShowDropdown(!showDropdown);
  };

  const addPhoneNumber = () => {
    if (newNumber.friendlyName && newNumber.number && !twilioPhoneNumbers.includes(newNumber)) {
      setTwilioPhoneNumbers((prev) => [...prev, newNumber]);
      setNewNumber({ friendlyName: "", number: "" }); 
      setAddNumber(false);
    } else {
      toast.error("Please fill in both Friendly Name and Number fields.");
    }
  };

  // Handler to select a phone number from the list
  const selectPhoneNumber = (number) => {
    setCurrentTwilioNumber(number);
    setShowDropdown(false); // Close dropdown after selection
  };

  // Handler to delete a phone number from the list
  const deletePhoneNumber = async (number, index) => {
    setTwilioPhoneNumbers((prev) => 
      prev.filter((_, i) => i !== index) // Remove the object at the specified index
    );
    if (currentTwilioNumber === number) {
      setCurrentTwilioNumber(""); // Clear current number if it was deleted
    }
    const data = {apiname: "twiliophonenumbervalidatorbyupro__Phone_Numbers", value: twilioPhoneNumbers}
    const request = await ZOHO.CRM.CONNECTOR.invokeAPI("crm.set",  data);
    const response = JSON.parse(request)
    if(response.status_code === '200'){
      toast('Number deleted successfully.')
    }
    else{
      console.log("Respnse", response)
    }
  };

  return (
    <div className="cover-container">
      <div className="cover-content">
        <div className="left-section"></div>
        <div className="right-section">
          <div className="vertical-text">
            <span id="twilio">Twilio</span>
            <div id="settings">Settings</div>
          </div>
        </div>
      </div>
      <div className="center-section">
        <div className="twilioSettingContent">
          <div className="detailinnerbox">
            <div className="settingsInputBox">
              <div className="currentNumberField">
                <div className="phoneNumberfield">
                  <input
                    type="text"
                    value={currentTwilioNumber}
                    readOnly
                    placeholder="Select a number"
                    style={{ marginRight: "10px" }}
                    />
                  <button onClick={() => setAddNumber(true)}><IoMdAddCircle size={20} /></button>
                  <button onClick={handleDropDown}>
                    <CiCircleChevUp
                      style={{
                        transform: showDropdown
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                          transition: "transform 0.5s ease-in-out",
                        }}
                        size={20}
                        />
                  </button>
                </div>

                {/* Dropdown menu for selecting/deleting numbers */}
                {showDropdown && (
                  <div className="dropDownContainer">

                    {/* Display message if no numbers are saved */}
                    {twilioPhoneNumbers.length === 0 ? (
                      <p>
                        No number saved yet
                      </p>
                    ) : (
                      <ul className="numberList">
                        {twilioPhoneNumbers.map((data, index) => (
                          <li key={data.number}>
                            <span>
                              {data.friendlyName || ""}
                            </span>
                            <span
                              onClick={() => selectPhoneNumber(data.number)}
                              style={{
                                flex: 1,
                                color:
                                currentTwilioNumber === data.number
                                ? "blue"
                                : "black",
                              }}
                              >
                              {data.number}
                            </span>
                            <button
                              onClick={() => deletePhoneNumber(data.number, index)}
                              id="numberDeleteButton"
                              >
                              {" "}
                              <MdOutlineDelete />{" "}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
                <p>Twilio Phone Number</p>
            </div>
            <div className="settingsInputBox">
              <input
                type="text"
                value={twilioSID}
                onChange={(e) => handleTwilioSID(e.target.value)}
                />
                <p>Account SID</p>
            </div>
            <div className="settingsInputBox">
              <input
                type="password"
                value={twiliotoken}
                onChange={(e) => handleTwilioToken(e.target.value)}
                />
                <p>Account Token</p>
            </div>
            <button onClick={saveCustomPropertiesOfTwilio} className="saveButton">Save</button>
          </div>
        </div>
          <div className="dropAnimation">
            <DropAnimation/>
          </div>
      </div>
      <ToastContainer/>
        <Modal open={addNumber} onClose={() => setAddNumber(false)} >
        <Box className="dropDownInput">
        <div className="numberInput">
          <span>Friendly Name</span>
          <input
          type="text"
          value={newNumber.friendlyName}
          onChange={(e) => setNewNumber((prev) => ({ ...prev, friendlyName : e.target.value}))}
          placeholder="Enter Friendly Name"
          style={{ width: "9rem" }}
          />
        </div>
        <div className="numberInput">
          <span>Twilio Number</span>
          <input
            type="text"
            value={newNumber.number}
            onChange={(e) => setNewNumber((prev) => ({ ...prev, number : e.target.value}))}
            placeholder="Enter phone number"
            style={{ width: "9rem" }}
            />
        </div>
      
      <button onClick={addPhoneNumber}>
        Save
      </button>
      </Box>
    </Modal>
    </div>
  );
};

export default Settings;
