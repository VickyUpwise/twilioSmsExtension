import axios from "axios";
import FormData from "form-data";

export const initialTwilioConfig = {
  userID: "",
  twilioSID: "",
  twilioToken: "",
  twilioNumber: [],
  currentTwilioNumber: "",
  messagingServiceSid: { friendlyName: "", Sid: "" },
  conversationServiceSid: { friendlyName: "", Sid: "" },
  newMessage: "",
  MessageSent: false,
  currentConversationSid: "",
  existingConversationSid: "",
  entity: "",
  entityId: "",
  entityData: {},
  receipientFullName: "",
  recipientPhone: "",
  recipientMobile: "",
  currentDefaultRecipientNumber: "",
  attachment: [],
  showExistedConversationWarning: false,
  renderCount: 0,
  activeSection: null,
  customModuleRecordId:'',
  autoValidationChecked: false,
};

export function twilioConfigReducer(state, action) {
  switch (action.type) {
    case "SET_CONFIG":
      return { ...state, ...action.payload };

    case "UPDATE_FIELD":
      return { ...state, [action.field]: action.value };

    case "RESET":
      return initialTwilioConfig;

    default:
      return state;
  }
}

// export async function fetchClientDetailsFromZoho(entity, entityData) {
//   console.log('entity', entity, 'entityData', entityData)
//   const res = await ZOHO.CRM.META.getFields({ Entity: entity });
//   const fields = res.fields
//     .filter((field) => entityData[field.api_name] != null)
//     .map((field) => ({
//       label: field.display_label,
//       value: field.api_name,
//     }));
//     console.log('field', fields)
//     return fields
// }

export async function fetchClientDetailsFromZoho(entity, entityData) {
  const res = await ZOHO.CRM.META.getFields({ Entity: entity });

  const extractNestedFields = (parentKey, obj) => {
    return Object.entries(obj).map(([key, val]) => ({
      label: `${parentKey}.${key}`,
      value: `${parentKey}.${key}`,
    }));
  };

  const fields = [];

  for (const field of res.fields) {
    const fieldValue = entityData[field.api_name];
    if (fieldValue != null) {
      if (typeof fieldValue === "object" && fieldValue !== null) {
        fields.push(...extractNestedFields(field.api_name, fieldValue));
      } else {
        fields.push({
          label: field.display_label,
          value: field.api_name,
        });
      }
    }
  }

  return fields;
}



export async function handleCreateConversation() {
  try {
    const formData = new FormData();
    formData.append("userId", initialTwilioConfig.userID);
    formData.append("From", initialTwilioConfig.currentTwilioNumber);
    formData.append("To", initialTwilioConfig.currentDefaultRecipientNumber);

    const response = await axios.post(
      "https://mediauploader-764980215.development.catalystserverless.com/server/twilioHelper/creat_conversation",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (response.data.success) {
      return {
        existingConversation: response.data.existingConversationSid,
        newConversation: response.data.conversationSid,
      };
    } else {
      console.warn("Conversation creation failed:", response.data.message);
      return null;
    }
  } catch (error) {
    console.error(
      "❌ Error in handleCreateConversation:",
      error.response?.data || error.message
    );
    throw error;
  }
}

export async function handleDeleteConversation(conversationSid) {
  try {
    const formData = new FormData();
    formData.append("userId", initialTwilioConfig.userID);
    formData.append("conversationSid", conversationSid);

    const response = await axios.post(
      "https://mediauploader-764980215.development.catalystserverless.com/server/twilioHelper/creat_conversation",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.success;
  } catch (error) {
    console.error(
      "❌ Error in handleDeleteConversation:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// export async function handleContinueConversation(){
//   await storeConversationSidInCustomModule(existedConversationSid)
//   await fetchPreviousMessagesFromTwilio(true)
//   setButtonState('idle')
//   setShowExistedConversationWarning(false)
// }

export const storeConversationSidInCustomModule = async (conversationSid) => {
  try {
    const recordData = {
      Name: defaultNumber,
      testankitext__Conversation_Sid: conversationSid,
      testankitext__From: twiliophone,
    };

    const insertResp = await ZOHO.CRM.API.insertRecord({
      Entity: "testankitext__Conversation_Sid",
      APIData: recordData,
      Trigger: ["workflow"],
    });
  } catch (error) {
    console.error("Error storing sid in custom module", error);
  }
};
