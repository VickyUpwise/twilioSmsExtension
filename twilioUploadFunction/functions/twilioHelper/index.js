const express = require("express");
const axios = require("axios");
const multer = require("multer");
const qs = require("querystring");
const fileUpload = require("express-fileupload");
const catalyst = require("zcatalyst-sdk-node");
const FormDataNode = require("form-data");
const { error } = require("console");
const { Readable } = require("stream");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const upload = multer(); // For parsing multipart/form-data

app.use(fileUpload({ limits: { fileSize: 6 * 1024 * 1024 } })); // 6MB max

async function getTwilioConfigByUserId(req, userId) {
  const zc = catalyst.initialize(req);
  const zcql = zc.zcql();

  const query = `SELECT * FROM twilio_config WHERE user_id = '${userId}'`;
  const result = await zcql.executeZCQLQuery(query);

  if (!result || result.length === 0) {
    return null;
  }

  return result[0].twilio_config;
}

const saveTwilio = async (zc, data) => {
  const datastore = zc.datastore();
  const table = datastore.table("twilio_config");
  const zcql = zc.zcql();

  const query = `SELECT * FROM twilio_config WHERE user_id = '${data.user_id}'`;
  const result = await zcql.executeZCQLQuery(query);

  // Normalize ZCQL shape -> row object (or null)
  const existing = result && result.length > 0 ? result[0].twilio_config : null;

  if (!existing) {
    // INSERT NEW ROW
    const inserted = await table.insertRow(data); // returns the inserted row including ROWID
    return {
      message: "Twilio configuration created.",
      row: inserted,
    };
  }

  const isChanged =
    existing.account_sid !== data.account_sid ||
    existing.account_token !== data.account_token ||
    existing.messaging_service_sid !== data.messaging_service_sid ||
    existing.conversation_service_sid !== data.conversation_service_sid;

  if (isChanged) {
    // UPDATE EXISTING ROW
    const updated = await table.updateRow({
      ...existing,
      ...data,
      ROWID: existing.ROWID,
    }); // returns the updated row
    return {
      message: "Twilio configuration updated.",
      row: updated,
    };
  }

  // No changes — return existing as-is
  return {
    message: "Twilio configuration already up to date.",
    row: existing,
  };
};


const extractPageToken = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.searchParams.get("PageToken");
  } catch {
    return null;
  }
};

function parseCatalystObjectString(str) {
  const clean = str.replace(/[{}]/g, "").split(", ");
  const obj = {};
  clean.forEach(pair => {
    const [key, value] = pair.split("=");
    obj[key] = value;
  });
  return obj;
}

const streamToBase64 = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  return buffer.toString("base64");
};

app.post("/twilio_number_list", async (req, res) => {
  const userId = req.query.userId || req.body.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Missing required userId parameter.",
    });
  }

  const config = await getTwilioConfigByUserId(req, userId);

  if (!config || !config.account_sid || !config.account_token) {
    return res.status(404).json({
      success: false,
      message: "Twilio configuration not found or incomplete.",
    });
  }

  const twilioURL = `https://api.twilio.com/2010-04-01/Accounts/${config.account_sid}/IncomingPhoneNumbers.json`;

  try {
    const response = await axios.get(twilioURL, {
      auth: {
        username: config.account_sid,
        password: config.account_token,
      },
    });

    const numbers = response.data.incoming_phone_numbers.map((number) => ({
      sid: number.sid,
      phoneNumber: number.phone_number,
      friendlyName: number.friendly_name,
      capabilities: number.capabilities,
      smsEnabled: number.capabilities?.sms || false,
      voiceEnabled: number.capabilities?.voice || false,
      dateCreated: number.date_created,
    }));

    return res.status(200).json({
      success: true,
      count: numbers.length,
      numbers,
    });
  } catch (error) {
    const errRes = error.response;
    return res.status(errRes?.status || 500).json({
      success: false,
      message: "Failed to fetch phone numbers",
      error: errRes?.data?.message || error.message,
    });
  }
});

app.post("/check_conversation_existance", upload.none(), async (req, res) => {
  const { accountSid, authToken, From, To } = req.body;

  if (!accountSid || !authToken || !From || !To) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: accountSid, authToken, From, or To",
    });
  }

  const auth = {
    username: accountSid,
    password: authToken,
  };

  try {
    const convoListRes = await axios.get(
      "https://conversations.twilio.com/v1/Conversations?PageSize=250",
      { auth }
    );

    const conversations = convoListRes.data.conversations;

    for (const convo of conversations) {
      const convoSid = convo.sid;
      const attributesRaw = convo.attributes;
      const friendlyName = convo.friendly_name || "";
      const uniqueName = convo.unique_name || "";

      // ✅ 1. Check Attributes
      if (attributesRaw) {
        try {
          const attrs = JSON.parse(attributesRaw);
          const isMatch =
            (attrs.From === From && attrs.To === To) ||
            (attrs.From === To && attrs.To === From);

          if (isMatch) {
            return res.status(200).json({
              exists: true,
              conversationSid: convoSid,
              matchedBy: "attributes",
            });
          }
        } catch (err) {
          console.warn(`⚠️ Invalid attributes JSON in convo ${convoSid}`);
        }
      }

      // ✅ 2. Check Friendly/Unique Name
      const nameMatch =
        (friendlyName.includes(From) && friendlyName.includes(To)) ||
        (uniqueName.includes(From) && uniqueName.includes(To));

      if (nameMatch) {
        await axios.post(
  `https://conversations.twilio.com/v1/Conversations/${convoSid}`,
  qs.stringify({
    Attributes: JSON.stringify({ "From": From, "To": To }),
  }),
  {
    auth,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  }
);

        return res.status(200).json({
          exists: true,
          conversationSid: convoSid,
          matchedBy: "friendly_name or unique_name (backfilled)",
        });
      }

      // ✅ 3. Check Participants (legacy)
      const participantsRes = await axios.get(
        `https://conversations.twilio.com/v1/Conversations/${convoSid}/Participants`,
        { auth }
      );

      const participantAddresses = participantsRes.data.participants.map(
        (p) => p.messaging_binding?.address
      );

      const hasFrom = participantAddresses.includes(From);
      const hasTo = participantAddresses.includes(To);

      if (hasFrom && hasTo) {
        await axios.post(
  `https://conversations.twilio.com/v1/Conversations/${convoSid}`,
  qs.stringify({
    Attributes: JSON.stringify({ "From": From, "To": To }),
  }),
  {
    auth,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  }
);

        return res.status(200).json({
          exists: true,
          conversationSid: convoSid,
          matchedBy: "participants (backfilled)",
        });
      }
    }

    return res.status(200).json({ exists: false });
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: "Failed to check conversation existence.",
      error: error.response?.data || error.message,
    });
  }
});

app.post("/creat_conversation", async (req, res) => {
  const userId = req.query.userId || req.body.userId;
  const {From, To } = req.body;

  if (!userId || !From || !To) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${!From? "Senders Number" : !To ? "Receivers Number" : "UserId"}`,
    });
  }

  const config = await getTwilioConfigByUserId(req, userId);

  if (!config || !config.account_sid || !config.account_token) {
    return res.status(404).json({
      success: false,
      message: "Twilio configuration not found or incomplete.",
    });
  }

  const auth = {
    username: config.account_sid ,
    password: config.account_token,
  };

  let newConversationSid;

  try {
    // ✅ 1. Create conversation
    const attributes = JSON.stringify({ "From": From, "To": To });
    const friendlyName = `Conversation between ${From} and ${To}`;

    const convoRes = await axios.post(
      "https://conversations.twilio.com/v1/Conversations",
      qs.stringify({
        Attributes: attributes,
        FriendlyName: friendlyName,
      }),
      {
        auth,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    newConversationSid = convoRes.data.sid;

    // ✅ 2. Add first participant (MessagingBinding)
    await axios.post(
      `https://conversations.twilio.com/v1/Conversations/${newConversationSid}/Participants`,
      qs.stringify({
        "MessagingBinding.Address": To,
        "MessagingBinding.ProxyAddress": From,
      }),
      {
        auth,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // ✅ 3. Add second participant (Identity = From)
    await axios.post(
      `https://conversations.twilio.com/v1/Conversations/${newConversationSid}/Participants`,
      qs.stringify({
        Identity: From,
      }),
      {
        auth,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // ✅ 4. Success
    return res.status(200).json({
      success: true,
      conversationSid: newConversationSid,
      reused: false,
    });
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;

    // ✅ 5. If participant already exists in another conversation
    if (
      errorMsg.includes("A binding for this participant and proxy address already exists in Conversation") ||
      errorMsg.includes("CH")
    ) {
      // Extract existing conversation SID
      const match = errorMsg.match(/Conversation\s+(CH[a-zA-Z0-9]+)/i);
		const existingConversationSid = match?.[1];

      // Delete the newly created conversation (cleanup)
      if (newConversationSid) {
        try {
          await axios.delete(
            `https://conversations.twilio.com/v1/Conversations/${newConversationSid}`,
            { auth }
          );
        } catch (delErr) {
          console.warn("⚠️ Failed to delete new conversation:", delErr.message);
        }
      }

      return res.status(200).json({
        success: true,
        conversationSid: existingConversationSid,
        reused: true,
        message: "Participant already exists in another conversation.",
		// error: errorMsg,
      });
    }

    // ❌ General failure
    if (newConversationSid) {
      try {
        await axios.delete(
          `https://conversations.twilio.com/v1/Conversations/${newConversationSid}`,
          { auth }
        );
      } catch (delErr) {
        console.warn("⚠️ Cleanup failed after error:", delErr.message);
      }
    }

    return res.status(error.response?.status || 500).json({
      success: false,
      message: "Failed to create or configure conversation.",
      error: errorMsg,
    });
  }
});

app.post("/delete_conversation", async (req, res) => {
  const { userId, conversationSid } = req.body;

  // Validate input
  if (!userId || !conversationSid) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${!userId?"userId": "conversationSid"}`,
    });
  }

  const config = await getTwilioConfigByUserId(req, userId);

  if (!config || !config.account_sid || !config.account_token) {
    return res.status(404).json({
      success: false,
      message: "Twilio configuration not found or incomplete.",
    });
  }

  const auth = {
    username: config.account_sid ,
    password: config.account_token,
  };

  try {
    const response = await axios.delete(
      `https://conversations.twilio.com/v1/Conversations/${conversationSid}`,
      { auth }
    );

    return res.status(200).json({
      success: true,
      message: `Conversation ${conversationSid} deleted successfully.`,
    });
  } catch (error) {
    const errRes = error.response?.data || error.message;
    return res.status(error.response?.status || 500).json({
      success: false,
      message: "Failed to delete conversation.",
      error: errRes,
    });
  }
});

app.post("/phone_number_validation", async (req, res) => {
  const { userId, phoneNumber } = req.body;

  if ( !userId|| !phoneNumber) {
    return res.status(400).json({
      valid: false,
      reason: `Missing ${ !userId? "userId" :"phoneNumber"}`,
    });
  }



  const config = await getTwilioConfigByUserId(req, userId);

  if (!config || !config.account_sid || !config.account_token) {
    return res.status(404).json({
      success: false,
      message: "Twilio configuration not found or incomplete.",
    });
  }

  const auth = {
    username: config.account_sid ,
    password: config.account_token,
  };

  try {
    const lookupRes = await axios.get(
      `https://lookups.twilio.com/v1/PhoneNumbers/${encodeURIComponent(phoneNumber)}?Type=carrier`,
      { auth }
    );

    const phoneInfo = lookupRes.data;

    // Check for country code and phone number formatting
    if (!phoneInfo.country_code || !phoneInfo.national_format) {
      return res.status(200).json({
        valid: false,
        reason: "Invalid format or missing country code",
      });
    }

    // Optional: detect mock/test numbers (Twilio's test numbers are often marked with carrier type = voip/test)
    const isMock = phoneInfo.carrier?.name?.toLowerCase().includes("test");

    if (isMock) {
      return res.status(200).json({
        valid: false,
        reason: "Number appears to be a test or mock number",

      });
    }

    // ✅ Passed all checks
    return res.status(200).json({
      valid: true,
      countryCode: phoneInfo.country_code,
      lineType: phoneInfo.carrier?.type,
    });
  } catch (error) {
    const code = error.response?.status;

    // Twilio Lookup returns 404 for invalid numbers
    if (code === 404) {
      return res.status(200).json({
        valid: false,
        reason: "Phone number not found (invalid)",
      });
    }

    return res.status(code || 500).json({
      valid: false,
      reason: "Failed to validate phone number",
      error: error.response?.data || error.message,
    });
  }
});

app.post("/send_message", async (req, res) => {
  try {

    const userId = req.query.userId || req.body.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Missing required userId parameter.",
    });
  }

  const config = await getTwilioConfigByUserId(req, userId);

  if (!config || !config.account_sid || !config.account_token) {
    return res.status(404).json({
      success: false,
      message: "Twilio configuration not found or incomplete.",
    });
  }
    const { text, conversationSid} = req.body;
    const parsedServiceSid = parseCatalystObjectString(config.conversation_service_sid);
const service_sid = parsedServiceSid.sid;

    const rawFiles = req.files?.files;
    const files = Array.isArray(rawFiles) ? rawFiles : rawFiles ? [rawFiles] : [];

    if (!conversationSid) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const authHeader = {
      Authorization: `Basic ${Buffer.from(`${config.account_sid}:${config.account_token}`).toString("base64")}`,
    };

    const sentMediaSids = [];

    // ✅ Step 1: Upload media & send as individual messages
    for (const file of files) {
      try {
        const formData = new FormDataNode();
        formData.append("file", file.data, {
          filename: file.name,
          contentType: file.mimetype,
        });

        const mcsRes = await axios.post(
          `https://mcs.us1.twilio.com/v1/Services/${service_sid}/Media`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              ...authHeader,
            },
          }
        );

        const mediaSid = mcsRes.data.sid;
        sentMediaSids.push({ [file.name]: mediaSid });

        // ✅ Send media message immediately after upload
        const msgPayload = new URLSearchParams();
        msgPayload.append("MediaSid", mediaSid);

       const response =  await axios.post(
          `https://conversations.twilio.com/v1/Conversations/${conversationSid}/Messages`,
          msgPayload,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              ...authHeader,
            },
          }
        );
      } catch (uploadErr) {
        console.error("❌ Failed media upload or send:", file.name, uploadErr.response?.data || uploadErr.message);
        return res.status(500).json({
          success: false,
          message: `Failed to upload or send media: ${file.name}`,
          error: uploadErr.response?.data || uploadErr.message,
        });
      }
    }

    // ✅ Step 2: Send text message (if present)
    let textMessageSid = null;
    if (text) {
      const textPayload = new URLSearchParams();
      textPayload.append("Body", text);

      const textRes = await axios.post(
        `https://conversations.twilio.com/v1/Conversations/${conversationSid}/Messages`,
        textPayload,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            ...authHeader,
          },
        }
      );

      textMessageSid = textRes.data.sid;
    }

    return res.status(200).json({
      success: true,
      mediaSids: sentMediaSids,
      textMessageSid,
      message: "Messages sent successfully",
      conversationSidInMessage: conversationSid
    });
  } catch (err) {
    console.error("❌ Fatal error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: err.response?.data || err.message,
    });
  }
});

app.post("/fetch_history", async (req, res) => {
  const {conversationSid, pageSize, pageToken } = req.body;
  
  if (!conversationSid) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: accountSid, authToken, or conversationSid",
    });
  }

  const userId = req.query.userId || req.body.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Missing required userId parameter.",
    });
  }

  const config = await getTwilioConfigByUserId(req, userId);

  if (!config || !config.account_sid || !config.account_token) {
    return res.status(404).json({
      success: false,
      message: "Twilio configuration not found or incomplete.",
    });
  }
  
  try {
    const auth = {
      username: config.account_sid,
      password: config.account_token,
    };
    
    const url = `https://conversations.twilio.com/v1/Conversations/${conversationSid}/Messages`;
    
    const params = {
      PageSize: pageSize || 100,
    Order: "desc"
    };
    
    if (pageToken) {
      params.PageToken = pageToken;
    }
    
    const response = await axios.get(url, {
      auth,
      params,
    });
    
    const messages = response.data.messages.map((msg) => ({
      sid: msg.sid,
      author: msg.author,
      body: msg.body,
      media: msg.media,
      dateCreated: msg.date_created,
      index: msg.index,
      delivery: msg.delivery
    }));
    
    return res.status(200).json({
      success: true,
      messages,
      nextPageToken: extractPageToken(response.data.meta.next_page_url),
    });
    
  } catch (error) {
    console.error("❌ Error fetching chat history:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: "Failed to fetch chat history.",
      error: error.response?.data || error.message,
    });
  }
});

app.post("/media_details", async (req, res) => {
  const { mediaSid } = req.body;
  const userId = req.query.userId || req.body.userId;

  if (!mediaSid || !userId) {
    return res.status(400).json({ success: false, message: "Missing required parameters." });
  }

  try {
    const config = await getTwilioConfigByUserId(req, userId);
    const parsedServiceSid = parseCatalystObjectString(config.conversation_service_sid);
    const service_sid = parsedServiceSid.sid;

    const twilioResponse = await axios.get(
      `https://mcs.us1.twilio.com/v1/Services/${service_sid}/Media/${mediaSid}`,
      { auth: { username: config.account_sid, password: config.account_token } }
    );
    const media = twilioResponse.data;

    // Get raw bytes
    const fileRes = await axios.get(media.links.content_direct_temporary, { responseType: "arraybuffer" });
    const base64File = Buffer.from(fileRes.data, "binary").toString("base64"); // ✅ always raw base64

    // Consistent field names
    return res.status(200).json({
      success: true,
      file: base64File,                        // no data: prefix
      filename: media.filename,
      contentType: media.content_type,
      size: media.size,
      dateCreated: media.date_created,         // camelCase
      sid: media.sid,
      category: media.category || null,
      source: "twilio",
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err?.message || "Failed to fetch media.",
      error: err,
    });
  }
});


app.post("/save_configuration", async (req, res) => {
  const { accountSid, authToken, messagingServiceSid, conversationServiceSid, userId} = req.body;

  if (!accountSid || !authToken || !messagingServiceSid || !conversationServiceSid || !userId) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields.",
    });
  }

  const parsedMessagingServiceSid = JSON.parse(messagingServiceSid);
  const parsedConversationServiceSid = JSON.parse(conversationServiceSid);

  try {
    const zc = catalyst.initialize(req);
    const result = await saveTwilio(zc, {
      user_id: userId,
      account_sid: accountSid,
      account_token: authToken,
      messaging_service_sid: parsedMessagingServiceSid,
      conversation_service_sid: parsedConversationServiceSid
    });

    return res.status(200).json({
      rowId: result.row.ROWID,
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Save failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to save Twilio configuration.",
      error: error.message,
    });
  }
});

app.post("/get_configuration", async (req, res) => {
  const userId = req.query.userId || req.body.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Missing required userId parameter.",
    });
  }

  try {
    const zc = catalyst.initialize(req);
    const zcql = zc.zcql();

    // 🔍 ZCQL query to get row by user_id
    const query = `SELECT ROWID, * FROM twilio_config WHERE user_id = '${userId}'`;
    const result = await zcql.executeZCQLQuery(query);

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No Twilio configuration found for the given user ID.",
      });
    }

    const config = result[0].twilio_config;
    console.log('config', config)

    return res.status(200).json({
      success: true,
      data: {
        rowId: config.ROWID,
        userId: config.user_id,
        accountSid: config.account_sid,
        authToken: config.account_token,
        messagingServiceSid: config.messaging_service_sid,
        conversationServiceSid: config.conversation_service_sid,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching Twilio config:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
});

app.post("/validate_number", async (req, res) => {
  const { accountSid, accountToken} = req.body;

  if ( !accountSid ||  !accountToken) {
    return res.status(400).json({
      valid: false,
      reason: `Missing required parameter`,
    });
  }

  const auth = {
    username: accountSid ,
    password: accountToken,
  };

  let accountData = null;
  let defaultMessagingService = null;
  let defaultConversationService = null;

  try {
    // ✅ 1. Verify Twilio Account
    const accountURL = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;
    const accountResponse = await axios.get(accountURL, { auth });
    accountData = accountResponse.data;
  } catch (error) {
    const errRes = error.response;

    if (errRes && errRes.status === 401 && errRes.data?.code === 20003) {
      const errorMessage = errRes.data.message;
      let userFriendlyMessage = "Authentication failed. Please check your credentials.";

      if (errorMessage === "Authenticate") {
        userFriendlyMessage = "Authentication failed: Invalid Auth Token.";
      } else if (errorMessage.includes("invalid username")) {
        userFriendlyMessage = "Authentication failed: Invalid Account SID.";
      }

      return res.status(401).json({
        success: false,
        message: userFriendlyMessage,
        error: errRes.data,
      });
    }

    return res.status(errRes?.status || 500).json({
      success: false,
      message: "Failed to verify Twilio account.",
      error: errRes?.data || error.message,
    });
  }

  // ✅ 2. Try fetching Messaging Services (fail gracefully)
  try {
    const messagingURL = `https://messaging.twilio.com/v1/Services`;
    const messagingResponse = await axios.get(messagingURL, { auth });

    const firstMessagingService = messagingResponse.data.services[0];
    if (firstMessagingService) {
      defaultMessagingService = {
        sid: firstMessagingService.sid,
        friendlyName: firstMessagingService.friendly_name,
      };
    }
  } catch (error) {
    console.error("Failed to fetch messaging services:", error.response?.data?.message || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch messaging services.",
      error: error.response?.data || error.message,
    });
  }

  // ✅ 3. Try fetching Conversation Services (fail gracefully)
  try {
    const conversationURL = `https://conversations.twilio.com/v1/Services`;
    const conversationResponse = await axios.get(conversationURL, { auth });

    const firstConversationService = conversationResponse.data.services[0];
    if (firstConversationService) {
      defaultConversationService = {
        sid: firstConversationService.sid,
        friendlyName: firstConversationService.friendly_name,
      };
    }
  } catch (error) {
    console.error("⚠️ Failed to fetch conversation services:", error.response?.data?.message || error.message);
     return res.status(500).json({
      success: false,
      message: "Failed to fetch conversation services.",
      error: error.response?.data || error.message,
    });
  }

  // ✅ 4. Final response
  return res.status(200).json({
    success: true,
    message: "Twilio account verified successfully",
    accountName: accountData.friendly_name,
    accountSid: accountData.sid,
    status: accountData.status,
    messagingService: defaultMessagingService,
    conversationService: defaultConversationService,
  });
});

module.exports = app;
