import axios from "axios";

const BASE_URL = "https://mediauploader-764980215.development.catalystserverless.com/server/twilioHelper";

// IndexedDB utility to store Twilio media with TTL
const DB_NAME = "TwilioMediaCache";
const STORE_NAME = "media";
const DB_VERSION = 1;
const TTL_MS = 15 * 24 * 60 * 60 * 1000; // 15 days in ms

// Initialize IndexedDB
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "mediaSid" });
        store.createIndex("expiry", "expiry", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.log('opening db reject', request.error)
      reject(request.error)
    };
  });
}

// Save media
export const saveMediaToIndexedDB = async (mediaSid, fileBase64, metadata) => {
  try{
    const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const expiry = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(); // 15 days

  const data = {
    mediaSid,
    file: fileBase64,
    ...metadata,
    expiry
  };

  store.put(data);
  return tx.complete;
  }
  catch(err){
    console.log("error  in storing data to db", err)
  }
};

async function getMediaFromIndexedDB(mediaSid) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const record = await new Promise((resolve, reject) => {
      const request = store.get(mediaSid);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();

    if (record && new Date(record.expiry).getTime() > Date.now()) {
      return {
        success: true,
        sid: mediaSid,
        filename: record.filename,
        contentType: record.contentType,
        size: record.size,
        category: record.category,
        file: record.file,
        dateCreated: record.dateCreated,
        source: "IndexDB",
      };
    }
  } catch (err) {
    console.error("err in getting data from db", err);
    return null;
  }
}

// Returns RAW base64 (no "data:mime;base64," prefix)
const convertFileToRawBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      try {
        const dataUrl = reader.result; // e.g. "data:text/calendar;base64,AAAA..."
        const commaIdx = String(dataUrl).indexOf(",");
        if (commaIdx === -1) return reject(new Error("Invalid data URL"));
        const rawBase64 = String(dataUrl).slice(commaIdx + 1); // strip prefix
        resolve(rawBase64);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
  });



export const createConversation = async (userId, from, to) => {
  try {
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("From", from);
    formData.append("To", to);

    const response = await axios.post(`${BASE_URL}/creat_conversation`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const {
      success,
      conversationSid,
      reused,
      message,
    } = response.data;

    return {
      conversationSuccess: success,
      conversationSid,
      reused,
      message,
    };
  } catch (err) {

    throw {
      success: false,
      conversationSid: null,
      reused: false,
      message: "Failed to create or configure conversation.",
      error: err.response?.data?.error || err.message,
    };
  }
};

export const deleteConversation = async (userId, conversationSid) => {
    try{
        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("conversationSid", conversationSid);

        const response = await axios.post(`${BASE_URL}/delete_conversation`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        const {success, message} = response.data;

        return {success, message}
    }
    catch(e){
      const {success, message, error} = e.response?.data || {};
      throw {success, message, error};
    }
  
};

export const fetchPreviousMessages = async (userId, conversationSid, pageToken) => {
    try{
        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("conversationSid", conversationSid);
        formData.append('pageToken', pageToken)
        formData.append('pageSize', 20)


        const response = await axios.post(`${BASE_URL}/fetch_history`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        const {
      success,
      messages: history = [],
      nextPageToken,
    } = response.data;

         return { success, history, nextPageToken};
    }catch(e){
        const {
      success = false,
      message = "Unknown error",
      error = e.message,
    } = e.response?.data || {};
    
    throw { success, message, error };
    }
  
};

export const sendMessage = async (userId, conversationSid, text, attachments) => {
  try {
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("conversationSid", conversationSid);
    formData.append("text", text);

    attachments.forEach((file) => formData.append("files", file));

    const response = await axios.post(`${BASE_URL}/send_message`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const { success, mediaSids, textMessageSid, message, conversationSidInMessage } = response.data;

    // ✅ Map mediaSids to files by filename
    if (mediaSids && Array.isArray(mediaSids)) {
      for (const media of mediaSids) {
        const filename = Object.keys(media)[0];
        const mediaSid = media[filename];

        const file = attachments.find((f) => f.name === filename);
        if (file) {
          const base64File = await convertFileToRawBase64(file);
          const metadata = {
            filename: file.name,
            size: file.size,
            contentType: file.type,
            dateCreated: new Date().toISOString(),
          };

          await saveMediaToIndexedDB(mediaSid, base64File, metadata);
        }
      }
    }

    return {
      success,
      mediaSids,
      textMessageSid,
      message,
      conversationSidInMessage,
    };
  } catch (e) {
    const errorData = e.response?.data || {};
    throw {
      success: false,
      message: errorData.reason || "Unknown error occurred",
      error: errorData.error || e.message,
    };
  }
};

export const fetchMediaDetails = async (userId, mediaSid) => {
  try {

    const existing = await getMediaFromIndexedDB(mediaSid);
    if (existing){
      return existing;
    } 
    
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("mediaSid", mediaSid);

    const response = await axios.post(`${BASE_URL}/media_details`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const {
      success,
      sid,
      filename,
      contentType,
      size,
      category,
      file,              // ✅ base64-encoded file
      date_created,
      source             // "cache" or "twilio"
    } = response.data;

    let metadata ={
      filename: filename,
            size: size,
            contentType: contentType,
            dateCreated: new Date().toISOString(),
    }

    if(success && file){
      await saveMediaToIndexedDB(mediaSid, file, metadata);
    }

    return {
      success,
      sid,
      filename,
      contentType,
      size,
      category,
      file,              // base64 content
      dateCreated: date_created,
      source,
    };
  } catch (e) {
    const errorData = e.response?.data || { message: "Unknown error" };
    throw {
      success: false,
      message: errorData.message || "Failed to fetch media details.",
      error: errorData.error || e.message,
    };
  }
};

export const validatePhoneNumberAPI = async (userId, phoneNumber) => {
    try{
  const formData = new FormData();
  formData.append("userId", userId);
  formData.append("phoneNumber", phoneNumber);

  const response = await axios.post(`${BASE_URL}/phone_number_validation`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const { valid, countryCode, lineType, reason} = response.data;

  return { valid, countryCode, lineType, reason};
}
catch(e){
    const errorData = e.response?.data || {};
    throw {
      valid: false,
      reason: errorData.reason || "Unknown error occurred",
      error: errorData.error || e.message,
    };
}
};

export const getConfiguration = async (userId) => {
  try{
    const formData = new FormData();
    formData.append("userId", userId);
  const response = await axios.post(`${BASE_URL}/get_configuration`, formData ,
    {headers:{
      "Content-Type":"application/form-data"
    }}
  )

  const {success, data} = response.data;

  return {success, data}
  }
  catch(e){
    const errorData = e.response.data || {}
    throw {
      success: errorData?.success || false, 
      message: errorData.message || "Unknown Error Occured", 
      error: errorData.error || e.message
    }
  }
}

export const saveConfiguration = async (userId, data) => {
  try{
  const formData = new FormData();
  formData.append("userId", userId);
  formData.append('accountSid', data.twilioSID);
  formData.append('authToken', data.twilioToken);
  formData.append('messagingServiceSid', JSON.stringify(data.messagingServiceSid));
  formData.append('conversationServiceSid', JSON.stringify(data.conversationServiceSid));

  const response = await axios.post(`${BASE_URL}/save_configuration`, formData,
    {headers:{
      "Content-Type":"application/form-data"
    }}
  )

  const {success, message, rowId} = response.data;

  return {success, message, rowId}
  }
  catch(e){
    const errorData = e.response?.data || {}
    throw {
      success: errorData?.success || false, 
      message: errorData.message || "Unknown Error Occured", 
      error: errorData.error || e.message
    }
  }
}

export const getTwilioNumbers = async (userId) => {
try{
   const formData = new FormData();
    formData.append("userId", userId);
  const response = await axios.post(`${BASE_URL}/twilio_number_list`, formData, 
    {headers:{
      "Content-Type":"application/form-data"
    }}
  )


  const {success, count, numbers} = response.data;

  return {success, count, numbers}
}
catch(e){
  const errorData = e.response?.data || {};
  throw {
    success: errorData.success || false,
    message: errorData.message || "Unknown error occured",
    error: errorData.error || e.message,
  }
}
}

export const validateAccount = async (accountSid, accountToken) => {
  try{
    const formData = new FormData();
    formData.append('accountSid', accountSid);
    formData.append('accountToken', accountToken);
    
    const response = await axios.post(`${BASE_URL}/validate_number`, 
      formData, 
      {
        headers: {
          "Content-Type":"application/form-data"
        }
      }
    );

    const {success, message, status, messagingService, conversationService} = response.data;
    return  {success, message, status, messagingService, conversationService}
  }
  catch(err){
    const errorData = err.response?.data || {};
    throw {
      success: errorData.success || false,
      message: errorData.message || "Unknown error occured",
      error: errorData.error || err.message,
    }
  }
}
