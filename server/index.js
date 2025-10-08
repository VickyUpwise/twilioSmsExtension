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
    console.log("results", response)
    res.json({ valid: true, data: response.data });
  } catch (error) {
    console.error("❌ Twilio Verification Failed:", error.response?.data || error);
    res.status(401).json({ valid: false, error: error.response?.data || "Authentication Failed" });
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

