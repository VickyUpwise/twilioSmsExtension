import React, {useState, useEffect} from 'react'
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow ,styled,  Switch} from '@mui/material';
import FooterComponent from '../FooterComponent/footerComponent';
import {getCurrentUserId, getCurrentTwilioNumber, getRecordDetails, getConversationSid, getAllRecords} from '../../ContextApi/zohoApis'
import {getConfiguration} from '../../ContextApi/twilioApis'
import { useTwilioConfig } from '../../ContextApi/twilioConfigContext';
import deleteIcon from '../../utility/dustdin.png'
import AddMoreRecords from './addMoreRecords';
import { sendMessage, createConversation, deleteConversation } from '../../ContextApi/twilioApis';

import './bulkMessage.scss'

const CustomeTableHead = styled(TableHead)({
    borderBottom: '1px solid #D1D9E0',
})

const CustomCell = styled(TableCell)({
  borderBottom: 'none',
  padding: '5px 16px',
  fontSize: '12px',
  textAlign: 'center'
})

const BulkMessage = () => {
  const { twilioConfig, dispatchTwilioConfig } = useTwilioConfig();
  const [records, setRecords] = useState([])
  const [availableRecords, setAvailableRecords] = useState([]);
  const [entity, setEntity] = useState('');

    useEffect(async () => {
        ZOHO.embeddedApp.on("PageLoad", async function (data) {
          fetchAccountCredentials()
          setEntity(data.Entity);
          fetchRecordsById(data.Entity, data.EntityId)
        });
        ZOHO.embeddedApp.init().then(() => {});
      }, []);

    useEffect(() => {
      if(records, twilioConfig.currentTwilioNumber)
      {
        fetchRecordConversationSid()
      }
    }, [twilioConfig.currentTwilioNumber])

    const fetchAccountCredentials = async () => {
      try{
        const userId = await getCurrentUserId();
        const senderNumber = await getCurrentTwilioNumber();
        const {accountSid, authToken, conversationServiceSid, messagingServiceSid} = await getConfiguration(userId);

        dispatchTwilioConfig({
          type:'SET_CONFIG',
          payload:{
            userID: userId,
            twilioSID: accountSid,
            twilioToken: authToken,
            currentTwilioNumber : senderNumber,
            messagingServiceSid,
            conversationServiceSid,
          }
        })
      }
      catch(error){
        console.log('Error in Fetching Credentails', error)
      }
    }

    const fetchRecordsById = async (entity, entityId) => {
    const records = [];
    try {
      for (const id of entityId) {
        const rec = await getRecordDetails(entity, id);
        const { Full_Name, First_Name, Last_Name, Mobile = "", Phone = "" } = rec || {};
        records.push({ Full_Name, First_Name, Last_Name, Mobile, Phone, id});
      }
      setRecords(records)
    } catch (error) {
      console.log("error getting records", error);
    }
    };

    const fetchRecordConversationSid = async () => {
    try {
      const updated = [];
      for (const r of records) {
        try {
          const { conversationSid } = await getConversationSid( r.Mobile, twilioConfig.currentTwilioNumber);
          updated.push({ ...r, conversationSid: conversationSid, carrierToUse: "Mobile"});
        } catch (e) {
          updated.push({ ...r, conversationSid: null, carrierToUse: "Mobile"});
        }
      }
      console.log('updated', updated)
      setRecords(updated);
    } catch (error) {
      console.log("Error getting sid", error);
    }
    };

    const handleCarrierChange = async (id) => {
      const toUpdate = records.filter((r) => r.id === id)
      const { conversationSid } = await getConversationSid(toUpdate[0].Phone, twilioConfig.currentTwilioNumber)
      const record = {...toUpdate[0], conversationSid: conversationSid, carrierToUse: "Phone"}
      setRecords((prev) => prev.map((r) => (r.id === id ? record : r)));
    }

    const handleRemoveRecord = (id) => {
      const removedRecord = records.filter(record => record.id == id)
      setAvailableRecords(prev => [...prev, removedRecord[0]])
      const updatedList = records.filter(record => record.id !== id)
      setRecords(updatedList)
    }

    const handleSendCick = () => {
      try{
        for(const record of records){
          if(record.conversationSid === null){
            // create new conversation
            try{
              const {conversationSuccess, conversationSid, reused, message} = createConversation(twilioConfig.userID, record.carrierToUse == "Phone" ? record.Phone : record.Mobile, twilioConfig.currentTwilioNumber, "Test Conversation from Twilio")
              if(conversationSuccess){
                console.log('Conversation created successfully', record.Full_Name, conversationSid, reused, message)
            }
           }
            catch(err){
              console.log('Error in creating conversation', err)
            }
          } else {
            // send message to existing conversation
            try{
              const {success, mediaSids, textMessageSid, message, conversationSidInMessage} = sendMessage(twilioConfig.userID, record.conversationSid, "Test Message from Twilio")
              if (success) console.log('Message sent successfully to existing conversation', record.Full_Name, record.conversationSid, conversationSidInMessage)
            }
            catch(err){
              console.log('Error in sending message to existing conversation', err)
            }
          }
        }
      } catch(error){
        console.log('Error in sending message', error)
      }
    }


    return(
        <Box className="bulkWrapperContainer">
          {/* Recors List Container */}
          <TableContainer className='tableContainer'>
            <Table>
              <CustomeTableHead>
                <TableRow>
                  <CustomCell style={{fontWeight: '600', textAlign:'left', fontSize: '14px'}}>Receipient Name</CustomCell>
                  <CustomCell style={{fontWeight: '600', fontSize: '14px'}}>Carrier</CustomCell>
                  <CustomCell style={{fontWeight: '600', fontSize: '14px'}}>Status</CustomCell>
                  <CustomCell style={{fontWeight: '600', fontSize: '14px'}}><AddMoreRecords entity={entity} existingRecords={records} setRecords={setRecords} availableRecords={availableRecords} setAvailableRecords={setAvailableRecords}/></CustomCell>
                </TableRow>
              </CustomeTableHead>
              <TableBody>
                {
                  records.map((record, index) => (
                      <TableRow key={index} style={{background: index%2 == 0 ? "none" : "#F9FBFD"}}>
                        <CustomCell style={{textAlign: 'left'}}>{record.Full_Name}</CustomCell>
                        <CustomCell>
                          {record.Mobile}
                          <Switch
                            color="primary"
                            checked={record.carrierToUse === "Phone"}
                            onChange={() => handleCarrierChange(record.id)}
                            />
                          {record.Phone}
                        </CustomCell>
                        <CustomCell>{record.conversationSid === null ? "New" : ""}</CustomCell>
                        <CustomCell>
                          <button onClick={() => handleRemoveRecord(record.id)} className='deleteRecordButton'>
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.375 3.2391C9.57125 3.06035 7.75667 2.96826 5.9475 2.96826C4.875 2.96826 3.8025 3.02243 2.73 3.13076L1.625 3.2391" stroke="#FF0004" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M4.60419 2.69225L4.72335 1.98266C4.81002 1.46808 4.87502 1.0835 5.79044 1.0835H7.2096C8.12502 1.0835 8.19544 1.48975 8.27669 1.98808L8.39585 2.69225" stroke="#FF0004" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M10.2104 4.95068L9.85836 10.4053C9.79878 11.2557 9.75003 11.9165 8.23878 11.9165H4.76128C3.25003 11.9165 3.20128 11.2557 3.1417 10.4053L2.78961 4.95068" stroke="#FF0004" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M5.5954 8.9375H7.39915" stroke="#FF0004" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M5.14581 6.771H7.85415" stroke="#FF0004" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                          </button>
                        </CustomCell>
                      </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box className="tableContainer">
            
          </Box>
          <FooterComponent/>
        </Box>
    )
}

export default BulkMessage