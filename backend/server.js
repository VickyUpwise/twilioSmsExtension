const express = require("express");
const cors = require("cors");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
const PORT = 5001; // ✅ Choose a free port

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Example: Twilio Media Upload Endpoint
app.post("/upload-to-twilio", async (req, res) => {
  try {
    const { accountSid, authToken, serviceSid } = req.headers;
    if (!accountSid || !authToken || !serviceSid) {
      return res.status(400).json({ error: "Missing required authentication parameters" });
    }

    if (!req.body.fileContent || !req.body.fileName || !req.body.mimeType) {
      return res.status(400).json({ error: "Invalid file data" });
    }

    const mediaUploadUrl = `https://mcs.us1.twilio.com/v1/Services/${serviceSid}/Media`;
    const formData = new FormData();
    formData.append("file", Buffer.from(req.body.fileContent, "base64"), {
      filename: req.body.fileName,
      contentType: req.body.mimeType,
    });

    const response = await axios.post(mediaUploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      },
    });

    res.json({ success: true, mediaSid: response.data.sid });
  } catch (error) {
    console.error("❌ Error uploading media:", error);
    res.status(500).json({ error: "Failed to upload media" });
  }
});

// ✅ Start the backend
app.listen(PORT, () => {
  console.log(`🚀 Backend running on https://localhost:${PORT}`);
});
