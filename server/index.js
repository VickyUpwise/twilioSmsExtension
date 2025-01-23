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
const upload = multer({ dest: 'uploads/' });
const FormData = require('form-data');

process.env.PWD = process.env.PWD || process.cwd();


var expressApp = express();
var port = 5000;


expressApp.set('port', port);
expressApp.use(morgan('dev'));
expressApp.use(bodyParser.json());
expressApp.use(bodyParser.urlencoded({ extended: false }));
expressApp.use(errorHandler());
expressApp.use(cors())


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

const fetchMyFolderId = async (accessToken) => {
  try {
    if (!accessToken) {
      throw new Error("Access token is missing");
    }

    // Step 1: Get user info to retrieve zuid
      const userInfoResponse = await axios.get(
        "https://www.zohoapis.com/workdrive/api/v1/users/me",
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      const zuid = userInfoResponse.data.data.id;


    // Step 2: Get a list of all teams the user belongs to
      const teamsResponse = await axios.get(
        `https://www.zohoapis.com/workdrive/api/v1/users/${zuid}/teams`,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const teams = teamsResponse.data.data;
      if (!teams || teams.length === 0) {
        throw new Error("No teams found for the current user");
      }
      const teamId = teams[0].id; // Assuming the first team is used; update logic if needed
    
     // Step 3: Get the team_member_id of the current user
      const teamMemberResponse = await axios.get(
        `https://www.zohoapis.com/workdrive/api/v1/teams/${teamId}/currentuser`,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const teamMemberId = teamMemberResponse.data.data.id;
      if (!teamMemberId) {
        throw new Error("Failed to fetch team_member_id");
      }

    // Step 4: Get the myfolder_id of the team member in the specified team
      const myFolderResponse = await axios.get(
        `https://www.zohoapis.com/workdrive/api/v1/users/${teamMemberId}/privatespace`,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const myFolderId = myFolderResponse.data.data[0].id;

      if (!myFolderId) {
        throw new Error("Failed to fetch myfolder_id");
      }

    return myFolderId;

  } catch (error) {
    throw error;
  }
};

expressApp.post('/upload', upload.single('content'), async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1];
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    let parentId = req.headers.parentId;
    if (!parentId) {
      parentId = await fetchMyFolderId(accessToken);
    }
    
    const linkName = file.originalname;
    const formData = new FormData();
    formData.append('parent_id', parentId);
    formData.append('content', fs.createReadStream(file.path));
    formData.append('filename', linkName)
    formData.append('override-name-exist', "true")

    const headers = {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        ...formData.getHeaders(), // Automatically sets 'Content-Type' including the boundary
      };
      
    const response = await axios.post(
        "https://www.zohoapis.com/workdrive/api/v1/upload",
        formData,
        { headers }
      );

    const fileId = response.data.data[0].attributes.resource_id;
    const uploadUrl = response.data.data[0].attributes.permalink;

    let publicUrl= null;
    const shareResponse = await axios.post(
        'https://www.zohoapis.com/workdrive/api/v1/links',
        {
          data: {
            attributes: {
              resource_id: fileId, // The unique file ID
              link_name: linkName,
              request_user_data: "false",
              allow_download: "true",
              role_id: "34", // View permission (as per API docs)
            },
            type: "links",
          },
        },
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      // Extract the public URL from the response
      publicUrl = shareResponse.data.data.attributes.link;

    res.json({ permalink: publicUrl, parentID: parentId, uploadURL : uploadUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    const errorMessage =
      error.response?.data?.errors?.[0]?.title || 'An unexpected error occurred.';
    console.log('Error details', errorMessage);
    return res
      .status(error.response?.status || 500)
      .json({ message: errorMessage });
}
});

expressApp.post("/refresh-token", async (req, res) => {
  const { refresh_token, client_id, client_secret } = req.body;

  try {
    const response = await axios.post(
      "https://accounts.zoho.com/oauth/v2/token",
      new URLSearchParams({
        refresh_token,
        client_id,
        client_secret,
        grant_type: "refresh_token",
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    res.json(response.data); // Return the Zoho API response to the frontend
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(error.response?.status || 500).json({
      message: error.message,
      details: error.response?.data || {},
    });
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

