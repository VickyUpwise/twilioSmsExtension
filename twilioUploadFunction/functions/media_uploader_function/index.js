const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const axios = require("axios");
const FormData = require("form-data");

const app = express();

app.use(fileUpload({ limits: { fileSize: 6 * 1024 * 1024 } })); // 6MB limit

app.post("/upload-to-twilio", async (req, res) => {
  try {
    const { fileName, fileType, twilioSid, twilioToken, serviceSid } = req.body;
    const file = req.files?.file;

    if (!file || !fileName || !fileType || !twilioSid || !twilioToken || !serviceSid) {
      return res.status(400).json({
        status: "error",
        message: "Missing required parameters or file.",
      });
    }

    const formData = new FormData();
    formData.append("file", file.data, {
      filename: fileName,
      contentType: fileType,
    });

    const response = await axios.post(
      `https://mcs.us1.twilio.com/v1/Services/${serviceSid}/Media`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64")}`,
        },
      }
    );

    return res.json({ status: "success", mediaSid: response.data.sid });
  } catch (error) {
    console.error("❌ Upload error:", error.response?.data || error.message);
    return res.status(500).json({
      status: "error",
      message: error.message,
      details: error.response?.data || null,
    });
  }
});

module.exports = app;
