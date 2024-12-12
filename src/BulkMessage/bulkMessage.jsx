import React , {useEffect, useState}from 'react'
import './bulkMessage.scss'

const BulkMessage = () => {
  const [entity, setEntity] = useState('')
  const [clientIds, setclientIds] = useState([])
  const [clientDetails, setClientDetails] = useState([]);


  useEffect(() => {
    ZOHO.embeddedApp.on("PageLoad",function(data)
    {
      setEntity(data.Entity)
      setclientIds(data.EntityId);
    })
    ZOHO.embeddedApp.init().then(() => {});
  }, []);

  useEffect(() => {
    if(clientIds){
      fetchClientDataByIds()
    }
  }, [clientIds])

  const fetchClientDataByIds = async () => {
    const batchSize = 10; // Number of records to process in each batch
    const maxRetries = 3; // Max number of retries for each API call
    const throttleDelay = 500; // Delay in milliseconds between batches
    const allClientDetails = [];
  
    // Utility to introduce delay
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  
    // Function to fetch a single record with retry logic
    const fetchRecordWithRetry = async (id, retries = maxRetries) => {
      try {
        const request = await ZOHO.CRM.API.getRecord({ Entity: entity, RecordID: id});
        const record = request.data[0];
        return {
          name: record.Full_Name || "N/A",
          Mobile: record.Mobile || "N/A",
          Phone: record.Phone || "N/A",
        };
      } catch (error) {
        if (retries > 0) {
          console.warn(`Retrying fetch for ID ${id}. Attempts left: ${retries}`);
          await delay(throttleDelay); // Wait before retrying
          return fetchRecordWithRetry(id, retries - 1);
        } else {
          console.error(`Failed to fetch record for ID ${id}:`, error);
          return null;
        }
      }
    };
  
    try {
      // Process records in batches
      for (let i = 0; i < clientIds.length; i += batchSize) {
        const batchIds = clientIds.slice(i, i + batchSize);
        const batchDetails = [];
  
        for (const id of batchIds) {
          const details = await fetchRecordWithRetry(id);
          if (details) batchDetails.push(details);
        }
  
        allClientDetails.push(...batchDetails);
  
        // Throttle between batches
        await delay(throttleDelay);
      }
      setClientDetails(allClientDetails);
      console.log("Fetched client details:", allClientDetails);
    } catch (error) {
      console.error("Error in fetching client data:", error);
    }
  };
  return (
    <div className="mainContainer">
      <div className="recipientsListContainer">
        <h1>Recipients</h1>
        {
          clientDetails.map((client) => {
            return(
              <div className="recipientsDetails">
                <span>{client.name}</span>
                <button>Mobile</button>
                <button>Phone</button>
              </div>
            )
          })
        }
        <button>Add</button>
      </div>
      <div className="messagingContainer"></div>
    </div>
  )
}

export default BulkMessage