const axios = require("axios");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
require("dotenv").config();

const tempToken = "ya29.a0AcM612zfHned8HXhJ7VZPLfjjNqgz55q_e3WfCjfp17Uq2427UgH-_YhVrmoGgXbQh6HpBGE13koibkWlf14ZBSfCJkLvvjdXpTeZXff_Poe4J5tx8Uj6OiPXzJeuYRxItr6amEUz5OfTbLmX4zvuP0kFMbnBHc0UMNwnLj7aCgYKAcISARESFQHGX2MidEo8V85A2fAjF6y2erm4Wg0175";

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI,
);

// Specify the scopes
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// Generate the URL for consent screen
const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
});

//console.log('Authorize this app by visiting this URL:', authUrl);

oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

function sendError(error){
  if (error.response) {
    console.error('Error status code:', error.response.status);
    console.error('Error response data:', error.response.data);
    return {status: "error", code: error.response.status, response: error.response.data};
  } else if (error.request) {
    console.error('Error request:', error.request);
    return {status: "error", request: error.request};
  } else {
    console.error('Error message:', error.message);
    return {status: "error", message: error.message};
  }
}

function generateConfig(url,token){
  return {
    method: "get",
    url: url,
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    }
  }
}
async function sendMail(reciever, subject, message) {
  const accessToken = await oAuth2Client.getAccessToken();
  const credentials = {
    service: "gmail",
    auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    //pass: process.env.EMAIL_PASS, (not necessary)
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
    accessToken: accessToken,
    },
  }
  const transport = nodemailer.createTransport(credentials);
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: reciever,
    subject: subject || "This is a test email from GMAIL API NodeJs",
    text: message,
  };
  try {
    const result = await transport.sendMail(mailOptions);
    return {status: "success", data: mailOptions};
  } catch (error) {
    return sendError(error);
  }
}

// http://localhost:8000/api/mail/user/blair.wallace1119@gmail.com
async function getUser(email) {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${email}/profile`;
    const { token } = await oAuth2Client.getAccessToken();
    const config = generateConfig(url, token);

    const response = await axios(config);
    const data = await response.data;
    return {status: "success", data: data};
  } catch (error) {
    return sendError(error);
  }
}

async function getDrafts(email) {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${email}/drafts`;
    const { token } = await oAuth2Client.getAccessToken();
    const config = generateConfig(url, token);
    const response = await axios(config);
    let data = await response.data;
    return {status: "success", data: data};
  } catch (error) {
    return sendError(error);
  }
}

async function readMail(mailId) {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/blairwallace1119.code@gmail.com/messages/${mailId}`;
    const { token } = await oAuth2Client.getAccessToken();
    const config = generateConfig(url, token);
    const response = await axios(config);
    let data = await response.data;
    return {status: "success", data: data};
  } catch (error) {
    return sendError(error);
  }
}

module.exports = {
  getUser,
  sendMail,
  getDrafts,
  readMail,
};