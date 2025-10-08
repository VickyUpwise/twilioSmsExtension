const express = require("express");
const axios = require("axios");
const multer = require("multer");

const app = express();
app.use(express.urlencoded({ extended: true }));
const upload = multer();



module.exports = app;
