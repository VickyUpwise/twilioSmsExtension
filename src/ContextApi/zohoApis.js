
export async function getCurrentTwilioNumber() {
    try{
        const { Success: { Content: currentTwilioNumber }} = await ZOHO.CRM.API.getOrgVariable("testankitext__Current_Twilio_Number");
        return(currentTwilioNumber);
    }
    catch(error){
        throw{message : 'error getting twilio Default number', error}
    }
}

export async function getCurrentUserId() {
    try{
        const { users } = await ZOHO.CRM.CONFIG.getCurrentUser();
        const userId = users[0].id;
        return(userId);
    }
    catch(error){
        throw{message :'error getting twilio Default number', error}
    }
}

export async function getRecordDetails(entity, entityId){
    try{
        const response = await ZOHO.CRM.API.getRecord({Entity: entity, RecordID: entityId});
        const {Full_Name, First_Name, Last_Name, Mobile, Phone} = response?.data?.[0];
        return {Full_Name, First_Name, Last_Name, Mobile, Phone};
    }
    catch(error){
        throw{
            message: 'error getting record details',
            error
        }
    }
}

export async function getAllRecords(entity, page, perPage = 50) {
  try {
    const res = await ZOHO.CRM.API.getAllRecords({
      Entity: entity,
      sort_order: "asc",
      per_page: perPage,
      page
    });

    const records = res?.data ?? [];
    const extractedRecords = [];

    for( const record of records){
      const {Full_Name, First_Name, Last_Name, Mobile, Phone, id} = record;
      extractedRecords.push({Full_Name, First_Name, Last_Name, Mobile, Phone, id})
    }

    // Prefer Zoho's flag if present; fallback to length check
    const more = (res?.info && typeof res.info.more_records === "boolean")
      ? res.info.more_records
      : records.length === perPage;

    return { extractedRecords, more };
  } catch (err) {
    console.error("Error fetching records:", err);
    // Surface an empty page and stop pagination on error
    return { records: [], more: false, error: err };
  }
}

export async function getConversationSid(recipientNumber, senderNumber) {
    try{
        const response = await ZOHO.CRM.API.searchRecord({
        Entity: "testankitext__Conversation_Sid",
        Type: "criteria",
        Query: `((Name:equals:${recipientNumber})and(testankitext__From:equals:${senderNumber}))`,
      });

    //   if (response?.statusText === "nocontent") {
    //     console.log('no content found in covesation sid')
    //     return null;
    //   }

      const matchFrom = response?.data?.[0]?.testankitext__From;
      if (matchFrom !== senderNumber) {
        console.log("Twilio 'From' mismatch.");
        return {conversationSid:null};
      }

      const conversationSid = response?.data?.[0]?.testankitext__Conversation_Sid;

      return {conversationSid}
    }
    catch(error){
        console.log('errorn getting sid', error)
        throw{
            message: 'Error getting Convsersation Sid',
            error,
        }
    }
}