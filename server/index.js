/*
Copyright (c) 2017, ZOHO CORPORATION
License: MIT
*/
var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var morgan = require('morgan');
var serveIndex = require('serve-index');
var https = require('https');
var chalk = require('chalk');
var cors = require('cors')
var axios = require('axios')
const multer = require('multer');
// const upload = multer({ dest: 'uploads/' });
const FormData = require('form-data');
const twilio = require("twilio");

process.env.PWD = process.env.PWD || process.cwd();


var expressApp = express();
var port = 5000;


expressApp.set('port', port);
expressApp.use(morgan('dev'));
expressApp.use(bodyParser.json());
expressApp.use(bodyParser.urlencoded({ extended: false }));
expressApp.use(errorHandler());
expressApp.use(cors())
expressApp.use(express.json());


expressApp.use('/', function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

expressApp.get('/plugin-manifest.json', function (req, res) {
  res.sendfile('plugin-manifest.json');
});

expressApp.use('/app', express.static('app'));
expressApp.use('/app', serveIndex('app'));


expressApp.get('/', function (req, res) {
  res.redirect('/app');
});

expressApp.get("/proxy", async (req, res) => {
  const { url } = req.query;
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    res.set("Content-Type", response.headers["content-type"]);
    res.set("Content-Length", response.headers["content-length"]);
    res.set("Access-Control-Allow-Origin", "*");
    res.send(response.data);
  } catch (error) {
    res.status(500).send("Error fetching the file");
  }
});
const storage = multer.memoryStorage();

// const fetchMyFolderId = async (accessToken) => {
//   try {
//     if (!accessToken) {
//       throw new Error("Access token is missing");
//     }

//     // Step 1: Get user info to retrieve zuid
//       const userInfoResponse = await axios.get(
//         "https://www.zohoapis.com/workdrive/api/v1/users/me",
//         {
//           headers: {
//             Authorization: `Zoho-oauthtoken ${accessToken}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       const zuid = userInfoResponse.data.data.id;


//     // Step 2: Get a list of all teams the user belongs to
//       const teamsResponse = await axios.get(
//         `https://www.zohoapis.com/workdrive/api/v1/users/${zuid}/teams`,
//         {
//           headers: {
//             Authorization: `Zoho-oauthtoken ${accessToken}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       const teams = teamsResponse.data.data;
//       if (!teams || teams.length === 0) {
//         throw new Error("No teams found for the current user");
//       }
//       const teamId = teams[0].id; // Assuming the first team is used; update logic if needed
    
//      // Step 3: Get the team_member_id of the current user
//       const teamMemberResponse = await axios.get(
//         `https://www.zohoapis.com/workdrive/api/v1/teams/${teamId}/currentuser`,
//         {
//           headers: {
//             Authorization: `Zoho-oauthtoken ${accessToken}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       const teamMemberId = teamMemberResponse.data.data.id;
//       if (!teamMemberId) {
//         throw new Error("Failed to fetch team_member_id");
//       }

//     // Step 4: Get the myfolder_id of the team member in the specified team
//       const myFolderResponse = await axios.get(
//         `https://www.zohoapis.com/workdrive/api/v1/users/${teamMemberId}/privatespace`,
//         {
//           headers: {
//             Authorization: `Zoho-oauthtoken ${accessToken}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       const myFolderId = myFolderResponse.data.data[0].id;

//       if (!myFolderId) {
//         throw new Error("Failed to fetch myfolder_id");
//       }

//     return myFolderId;

//   } catch (error) {
//     throw error;
//   }
// };

// expressApp.post('/upload', upload.single('content'), async (req, res) => {
//   try {
//     const accessToken = req.headers.authorization?.split(" ")[1];
//     const file = req.file;

//     if (!file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }
    
//     let parentId = req.headers.parentId;
//     if (!parentId) {
//       parentId = await fetchMyFolderId(accessToken);
//     }
    
//     const linkName = file.originalname;
//     const formData = new FormData();
//     formData.append('parent_id', parentId);
//     formData.append('content', fs.createReadStream(file.path));
//     formData.append('filename', linkName)
//     formData.append('override-name-exist', "true")

//     const headers = {
//         Authorization: `Zoho-oauthtoken ${accessToken}`,
//         ...formData.getHeaders(), // Automatically sets 'Content-Type' including the boundary
//       };
      
//     const response = await axios.post(
//         "https://www.zohoapis.com/workdrive/api/v1/upload",
//         formData,
//         { headers }
//       );

//     const fileId = response.data.data[0].attributes.resource_id;
//     const uploadUrl = response.data.data[0].attributes.permalink;

//     let publicUrl= null;
//     const shareResponse = await axios.post(
//         'https://www.zohoapis.com/workdrive/api/v1/links',
//         {
//           data: {
//             attributes: {
//               resource_id: fileId, // The unique file ID
//               link_name: linkName,
//               request_user_data: "false",
//               allow_download: "true",
//               role_id: "34", // View permission (as per API docs)
//             },
//             type: "links",
//           },
//         },
//         {
//           headers: {
//             Authorization: `Zoho-oauthtoken ${accessToken}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       // Extract the public URL from the response
//       publicUrl = shareResponse.data.data.attributes.link;

//     res.json({ permalink: publicUrl, parentID: parentId, uploadURL : uploadUrl });
//   } catch (error) {
//     console.error('Error uploading file:', error);
//     const errorMessage =
//       error.response?.data?.errors?.[0]?.title || 'An unexpected error occurred.';
//     console.log('Error details', errorMessage);
//     return res
//       .status(error.response?.status || 500)
//       .json({ message: errorMessage });
// }
// });
const upload = multer({ storage: multer.memoryStorage() });
const TWILIO_FUNCTION_URL = "https://twiliomedia-4043.twil.io/upload";
// expressApp.post("/upload", upload.single("file"), async (req, res) => {
//   try {
//     const { accountSid, authToken } = req.body; // Receive credentials from frontend
//     const { originalname, buffer } = req.file;
//     const fileData = buffer.toString("base64"); // Convert to Base64
//     const SERVICE_SID = "ZSb44119a3d069db77dc18ff65f6df22f7";

//     if (!accountSid || !authToken) {
//       return res.status(400).json({ error: "Missing Twilio credentials" });
//     }

//     // Encode credentials for Basic Auth
//     const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}:${SERVICE_SID}`).toString("base64")}`;

//     // Send file to Twilio Function with authentication
//     const response = await axios.post(
//       TWILIO_FUNCTION_URL,
//       { fileData, fileName: originalname },
//       {
//         headers: {
//           Authorization: authHeader,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     res.json({ url: response.data.url }); // Send Twilio Asset URL to frontend
//   } catch (error) {
//     console.error("Error uploading to Twilio:", error.response ? error.response.data : error);
//     res.status(500).json({ error: "Upload failed" });
//   }
// });

// ✅ API to Verify Twilio Credentials
expressApp.post("/verify-twilio", async (req, res) => {
  const { accountSid, authToken } = req.body;

  if (!accountSid || !authToken) {
    return res.status(400).json({ error: "Missing Twilio SID or Auth Token" });
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;

  try {
    const response = await axios.get(url, {
      auth: { username: accountSid, password: authToken }
    });

    res.json({ valid: true, data: response.data });
  } catch (error) {
    console.error("❌ Twilio Verification Failed:", error.response?.data || error);
    res.status(401).json({ valid: false, error: error.response?.data || "Authentication Failed" });
  }
});

const uploadToTwilioMCS = async (fileBuffer, fileName, mimeType, accountSid, authToken, serviceSid) => {
  try {
    // Twilio MCS API URL
    
    const mediaUploadUrl = `https://mcs.us1.twilio.com/v1/Services/${serviceSid}/Media`;

    // ✅ Prepare FormData for Twilio Upload
    const formData = new FormData();
    formData.append("file", fileBuffer, {
      filename: fileName,
      contentType: mimeType,
    });

    // ✅ Upload File to Twilio MCS
    const response = await axios.post(mediaUploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      },
    });

    return response.data.sid; // ✅ Return the MediaSid
  } catch (error) {
    console.error("❌ Error uploading media to Twilio MCS:", error.response ? error.response.data : error.message);
    return null;
  }
};

// ✅ API Endpoint to Upload Multiple Files to Twilio MCS
expressApp.post("/upload-to-twilio", upload.array("files", 10),async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }
    const accountSid = req.headers["accountsid"];
const authToken = req.headers["authtoken"];
const serviceSid = req.headers["servicesid"];
    console.log({"accountsid": accountSid}, {"authtoken":authToken}, {"servicesid":serviceSid})
    if (!accountSid || !authToken || !serviceSid) {
      return res.status(400).json({ error: "Missing required authentication parameters" });
    }
    // ✅ Process Each File
    const uploadPromises = req.files.map(file =>
      uploadToTwilioMCS(file.buffer, file.originalname, file.mimetype, accountSid, authToken, serviceSid)
    );

    // ✅ Wait for All Uploads to Finish
    const mediaSids = await Promise.all(uploadPromises);

    // ✅ Filter out failed uploads
    const successfulUploads = mediaSids.filter(sid => sid !== null);

    if (successfulUploads.length === 0) {
      return res.status(500).json({ success: false, error: "Failed to upload files to Twilio" });
    }

    // ✅ Send Response to Frontend
    res.json({
      success: true,
      mediaSids: successfulUploads,
      message: "Files uploaded successfully to Twilio",
    });
  } catch (error) {
    console.error("❌ Error processing upload:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// expressApp.post("/refresh-token", async (req, res) => {
//   const { refresh_token, client_id, client_secret } = req.body;

//   try {
//     const response = await axios.post(
//       "https://accounts.zoho.com/oauth/v2/token",
//       new URLSearchParams({
//         refresh_token,
//         client_id,
//         client_secret,
//         grant_type: "refresh_token",
//       }).toString(),
//       {
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded",
//         },
//       }
//     );

//     res.json(response.data); // Return the Zoho API response to the frontend
//   } catch (error) {
//     console.error("Error refreshing token:", error);
//     res.status(error.response?.status || 500).json({
//       message: error.message,
//       details: error.response?.data || {},
//     });
//   }
// });

expressApp.post("/get-access-token", (req, res) => {
  try {
      const { accountSid, apiKey, apiSecret, serviceSid, identity} = req.query;

      if (!identity) {
          return res.status(400).json({ error: "Identity is required" });
      }

      // Create Twilio Access Token
      const AccessToken = twilio.jwt.AccessToken;
      const ChatGrant = AccessToken.ChatGrant;

      const token = new AccessToken(accountSid, apiKey, apiSecret, {
          identity: identity, // Unique identifier for user
          ttl: 3600, // Token expires in 1 hour
      });

      // Grant access to Twilio Conversations
      token.addGrant(
          new ChatGrant({
              serviceSid: serviceSid,
          })
      );

      console.log("✅ Access Token Generated");
      res.json({ token: token.toJwt() }); // Send JWT token to frontend
  } catch (error) {
      console.error("❌ Error generating access token:", error);
      res.status(500).json({ error: "Server error" });
  }
});

var options = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
};

https.createServer(options, expressApp).listen(port, function () {
  console.log(chalk.green('Zet running at ht' + 'tps://127.0.0.1:' + port));
  console.log(chalk.bold.cyan("Note: Please enable the host (https://127.0.0.1:"+port+") in a new tab and authorize the connection by clicking Advanced->Proceed to 127.0.0.1 (unsafe)."));
}).on('error', function (err) {
  if (err.code === 'EADDRINUSE') {
    console.log(chalk.bold.red(port + " port is already in use"));
  }
});

/*
Copyright (c) 2017, ZOHO CORPORATION
License: MIT
*/
// var fs = require('fs');
// var path = require('path');
// var express = require('express');
// var bodyParser = require('body-parser');
// var errorHandler = require('errorhandler');
// var morgan = require('morgan');
// var serveIndex = require('serve-index');
// var https = require('https');
// var chalk = require('chalk');

// process.env.PWD = process.env.PWD || process.cwd();


// var expressApp = express();
// var port = 5000;

// expressApp.set('port', port);
// expressApp.use(morgan('dev'));
// expressApp.use(bodyParser.json());
// expressApp.use(bodyParser.urlencoded({ extended: false }));
// expressApp.use(errorHandler());


// expressApp.use('/', function (req, res, next) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   next();
// });

// expressApp.get('/plugin-manifest.json', function (req, res) {
//   res.sendfile('plugin-manifest.json');
// });

// expressApp.use('/app', express.static('app'));
// expressApp.use('/app', serveIndex('app'));


// expressApp.get('/', function (req, res) {
//   res.redirect('/app');
// });

// var options = {
//   key: fs.readFileSync('./key.pem'),
//   cert: fs.readFileSync('./cert.pem')
// };

// https.createServer(options, expressApp).listen(port, function () {
//   console.log(chalk.green('Zet running at ht' + 'tps://127.0.0.1:' + port));
//   console.log(chalk.bold.cyan("Note: Please enable the host (https://127.0.0.1:"+port+") in a new tab and authorize the connection by clicking Advanced->Proceed to 127.0.0.1 (unsafe)."));
// }).on('error', function (err) {
//   if (err.code === 'EADDRINUSE') {
//     console.log(chalk.bold.red(port + " port is already in use"));
//   }
// });
