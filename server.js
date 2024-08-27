const express = require('express');
const path = require('path');
const { getUser, sendMail, getDrafts, readMail } = require("./public/src/tools/gmail_");
const { format, addMinutes, isAfter } = require("date-fns");
const SendmailTransport = require('nodemailer/lib/sendmail-transport');
require("dotenv").config();

// modules
const {saveUsers, getUsers,newUser,userExist, updateUser} = require("./public/src/server/users");
const { SURVEYDATA, QUESTION, QUESTIONTYPE, getSurveys, newSurvey, newQuestion, updateSurvey} = require("./public/src/server/surveys");
const { tr } = require('date-fns/locale');

const app = express();
const PORT=process.env.PORT; 

let userConformationCodes = [];

const CODE_EXPIRATION_TIME = 5; // 5 minutes (ms * sec * min)

// Serve static files from the 'public' directory
app.use(express.static("public"));
app.use(express.json());

// getting mail
app.get("/mail/:dynamic", async (req, res) => {
    const dynamic = req.params.dynamic
    const data = {};

    res.status(200).json(data);
})

// mail functions
app.post("/mail/:dynamic", async (req, res) => {
    const dynamic = req.params.dynamic
    let body = req.body;
    if (!body) {
        return res.status(400).send({status: "failed", message: "No body provided"});
    }
    body = body.data || body;

    function returnData(data){
        if (data.status === "error"){return res.status(data.code || 404).send(data);}
    
        res.status(200).send({status: "recieved", data: data.data});
    }

    switch (dynamic) {
        case "getUserEmail":
            returnData(await getUser(body.email_address));
        break;

        case "getUserDrafts":
            returnData(await getDrafts(body.email_address));
        break;

        case "readUserMail":
            returnData(await readMail(body.mailId));
        break;

        case "sendMail":
            returnData(await sendMail(body.reciever, body.subject, body.message));
        break;

        default:
             res.status(400).send({status: "Invalid request", message: "Invalid request"});
        break;
    }
})

// new user
app.post("/users", async (req, res) => {
    return newUser(req.body.data);
})

// update user
app.put("/users/:id", async (req, res) => {
    const users = getUsers();
    const id = parseInt(req.params.id);
    const updatedUserData = req.body.data;

    const userIndex = users.findIndex((user) => user.id === id);
    if (userIndex === -1) {
        return res.status(404).send({status: "failed", message: "User not found"});
    }
    users[userIndex] = {...users[userIndex], ...updatedUserData};
    saveUsers(users);
    res.status(200).send({status: "success", message: "User updated", data: users[userIndex]});
})

// get all users
app.get("/users", async (req, res) => {
    const users = getUsers();
    res.json({
        count: users.length,
        users: users,
      });
})

// request conformation code
app.post("/users/requestCodeConfirmation", async (req, res) => {
    const users = getUsers();
    const parcelUsername = req.body.data.username;
    let parcelEmail = req.body.data.email;
    const type = req.body.data.type;
    const isNewUser = req.body.data.newUser;
    
    const user = users.find((user) => user.username === parcelUsername || user.email === parcelUsername);
    if (isNewUser) {
        // missing credentials
        if (userExist(parcelEmail)){
            return res.status(400).send({status: "failed", message: "User already exists"});
        }
        // email or pass work is not set
        if (!parcelEmail || !parcelUsername || parcelEmail.length == 0 || parcelUsername.length == 0) {
            return res.status(404).send({status: "failed", message: "Missing credentials"});
        }
        if (parcelUsername.length <= 2) {
            return res.status(404).send({status: "failed", message: "Username is too short"});
        }
        // not an email account
        // if (!parcelEmail.toLowerCase().endsWith("@gmail.com")) {
        //     return res.status(404).send({status: "failed", message: "Must be a gmail account"});
        // }
    }
    else {
        if (!user) {
            return res.status(404).send({status: "failed", message: "User not found"});
        }
        else if (!parcelEmail){
            parcelEmail = user.email;
        }
    }

    // code already sent
    // let codeExist = null;
    // for (const currentCodes of userConformationCodes){
    //     if (currentCodes && currentCodes.email === user.email) {
    //         codeExist = currentCodes;
    //         break;
    //     }
    // }

    // if (codeExist){
    //     if (type && type === "resend") {
    //         // resend code
    //         clearInterval(codeExist.conformationCode.interval);
    //         userConformationCodes[user.id || parcelEmail] = null;
    //     }
    //     else {
    //         return res.status(400).send({status: "failed", message: "Code already sent"});
    //     }
    // }

    // send email and check if successfull
    const conformationCode = Math.floor(100000 + Math.random() * 900000)

    if (process.env.SEND_EMAILS === "true"){
        const sendmailResult = await sendMail(parcelEmail, process.env.WEBSITE_NAME + " Conformation Code", `Your conformation code is: ${conformationCode} Please do not share this code with anyone.` )
        if (sendmailResult.status !== "success") {
            return res.status(400).send({status: "failed", message: "Email not sent", data: sendmailResult.data});
        }
        else { // email sent
        }
    }

    const now = new Date();
    const codeExpire = addMinutes(now, CODE_EXPIRATION_TIME);

    // send conformation code
    let serverInformation = {
        name: parcelUsername,
        email: parcelEmail,
        conformationCode: {
            code: conformationCode,
            codeExpire: codeExpire, // x minutes
            // schedule a task to check the expiration
            interval: setInterval(() => {
                const currentTime = new Date();
                if (isAfter (currentTime, codeExpire)) {
                    userConformationCodes[parcelEmail] = null;
                    clearInterval(serverInformation.conformationCode.interval); // stop interval
                }
             }, 1000) // check every second
        },
    }

    console.log("The code is:" + serverInformation.conformationCode.code);

    let clientInformation = {
        codeExpireTime: CODE_EXPIRATION_TIME * 60, // in seconds 
        resent: type === "resend",
    }

    userConformationCodes[parcelEmail] = serverInformation;    

    res.status(200).send({status: "success", message: "Conformation code sent", data: clientInformation});
})

app.post("/users/testConformationCode", async (req, res) => {
    const users = getUsers();
    const code = parseInt(req.body.data.code);
    const parcelUsername = req.body.data.name || req.body.data.username;
    let parcelEmail = req.body.data.email;
    const isNewUser = req.body.data.newUser;
    const user = users.find((user) => user.email === parcelUsername || user.email === parcelEmail);
    if (isNewUser) {
        // missing credentials
        if (userExist(parcelEmail)){
            return res.status(400).send({status: "failed", message: "User already exists"});
        }
        if (!parcelEmail || !parcelUsername || parcelEmail.length == 0 || parcelUsername.length == 0) {
            return res.status(404).send({status: "failed", message: "Missing credentials"});
        }
        if (parcelUsername.length < 1) {
            return res.status(404).send({status: "failed", message: "Username is too short"});
        }
        // not an email account
        // if (!parcelEmail.toLowerCase().endsWith("@gmail.com")) {
        //     return res.status(404).send({status: "failed", message: "Must be a gmail account"});
        // }
    }
    else {
        if (!user) {
            return res.status(404).send({status: "failed", message: "User not found"});
        }
        else if (!parcelEmail){
            parcelEmail = user.email
        }
    }

    const conformationCode = userConformationCodes[parcelEmail];

    // conformation code not found
    if (!conformationCode) {
        return res.status(404).send({status: "failed", message: "Conformation code not found"});
    }

    // code does not match
    if (conformationCode.conformationCode.code !== code) {
        return res.status(400).send({status: "failed", message: "Invalid conformation code"});
    }

    // code successfully sent
    clearInterval(conformationCode.conformationCode.interval);
    userConformationCodes[parcelEmail] = null;

    if (isNewUser) {
        // create new user
        const [code, info] = newUser({username: parcelUsername, email: parcelEmail})

        if (process.env.EMAIL_USER !== parcelEmail && process.env.SEND_EMAILS === "true" && code === 200){
            const sendmailResult = await sendMail(process.env.EMAIL_USER,
                "[" + process.env.WEBSITE_NAME + "] New User",
                "A user has registered to the website\n Email:" + parcelEmail + "\n Username:"+ parcelUsername
                )
        }

        return res.status(code).send(info);
    }
    res.status(200).send({status: "success", message: "Conformation code accepted", data: user});
})

// Surveys
app.get("/surveys",async (req,res) => {
    res.status(200).send({status: "success", data: getSurveys()})
})

app.post("/surveys/postUserSurvey", async (req,res) => {
    const data = req.body.data;

    const survey = data.survey;
    const surveyId = data.surveyId;
    const userData = data.user;
    let user = null;

    // see if user exist
    if (!userData){
        res.status(400).send({status:"failed", message: "User does not exist"});
    }
    else if (!getUsers().find(item => item.email === userData.email)) {
        // check if user exist
        res.status(400).send({status:"failed", message: "User does not found"});
    }

    user = getUsers().find(item => item.email === userData.email);

    if (!user){
        res.status(400).send({status:"failed", message: "User does not exist"});
    }

    // detect if survey exist
    const targetSurvey = getSurveys().find(item => item.id === surveyId);
    if (!targetSurvey){
        res.status(400).send({status:"failed", message: "Survey does not exist"});
    }

    // detect if all questions are answered
    let notCompletedQuestions = []; // question number
    for (const i in survey){
        const d = survey[i];
        if (d.answer == null) {
            notCompletedQuestions.push(parseInt(i) + 1);
        }
        else if (typeof d.answer == "string" && d.answer.length == 0){
            notCompletedQuestions.push(parseInt(i) + 1);
        }
        else if (d.answer.open_ended && d.answer.open_ended_msg.length == 0){
            notCompletedQuestions.push(parseInt(i) + 1);
        }
        else if (Array.isArray(d.answer) && d.answer.length == 0){
            notCompletedQuestions.push(parseInt(i) + 1);
        }
    }

    if (notCompletedQuestions.length > 0) {
        // display the questions that are not completed
        console.log("Survey not completed");
        res.status(400).send({status:"failed", message: "Survey is not completed"});
    }
    // if this survey is in progress then remove it
    user.inprogress_survey = user.inprogress_survey.filter(function(s){
        return s.id !== surveyId;
    });

    // if survey is already completed then override it
    user.completed_survey = user.completed_survey.filter(function(s){
        return s.id !== surveyId;
    });
    user.completed_survey.push({
        completedOn: new Date().toLocaleString(),
        startedOn: data.timeStarted,
        name: data.name,
        id: surveyId,
        "survey": survey,
    })

    updateUser(user.email,user);

    targetSurvey.completed += 1;
    updateSurvey(surveyId, targetSurvey);

    if (process.env.SEND_EMAILS === "true"){
        // send mail to user that he has completed the survey
        const sendmailResult = await sendMail(user.email,
            "["+ process.env.WEBSITE_NAME + "] survey complete",
            "Congrations you have completed the " + data.name + " survey! Thank you for your feedback."
            )
        
            // if the user is not admin, then notify the admin that a user has completed a survey
            if (process.env.EMAIL_USER !== user.email) {
                const sendmailResult = await sendMail(process.env.EMAIL_USER,
                "[" + process.env.WEBSITE_NAME + "] User has completed a survey",
                "A user (" + user.username + ") has completed a survey\n Survey:" + data.name + "\n Email:" + user.email + "\n Username:" + user.username 
                )
            }
    }

    // survey is completed save survey
    res.status(200).send({status:"success", message: "Survey completed"});
})

app.post("/surveys/saveUserSurvey", async (req,res) => {
    const data = req.body.data;

    const survey = data.survey;
    const surveyId = data.surveyId;
    const userData = data.user;
    let user = null;

    // see if user exist
    if (!userData || !userExist(userData.email) || !getUsers().find(item => item.email === userData.email)) {
        res.status(400).send({status:"failed", message: "User does not exist"});
    }

    user = getUsers().find(item => item.email === userData.email);

    // detect if survey exist
    const targetSurvey = getSurveys().find(item => item.id === surveyId);
    if (!targetSurvey){
        res.status(400).send({status:"failed", message: "Survey does not exist"});
    }

    // if this survey is in progress then remove it
    user.inprogress_survey = user.inprogress_survey.filter(function(s){
        return s.id !== surveyId;
    });

    // add survey to queue
    user.inprogress_survey.push({
        lastTimeOn: new Date().toLocaleString(),
        startedOn: data.timeStarted,
        "name": data.name,
        id: surveyId,
        "survey": survey,
    })

    updateUser(user.email,user);

    res.status(200).send({status:"success", message: "Survey added to queue"});
})

const survey = SURVEYDATA;
survey.name = "Introduction v1";

newQuestion(SURVEYDATA,{
    type:"open",
    name:"What is your name?",
})

newQuestion(SURVEYDATA,{
    type:"open",
    name:"What is your favorite food?",
})

newQuestion(SURVEYDATA,{
    type:"open",
    name:"What is your favorite choice of drink?",
})

newQuestion(SURVEYDATA,{
    type:"open",
    name:"What are your hobbies?",
})

newQuestion(SURVEYDATA,{
    type:"open",
    name:"What is one cool fact about yourself?",
})

newQuestion(SURVEYDATA,{
    type:"open",
    name:"What is one thing that you want to improve in yourself??",
})

// newQuestion(SURVEYDATA,{
//     type: "open",
//     name: "open question",
//     data: "",
// });
// newQuestion(SURVEYDATA,{
//     type: "multiple",
//     name: "multiple question",
//     data: ["one","two","three","four"],
// });
// newQuestion(SURVEYDATA,{
//     type: "selection",
//     name: "selection question",
//     data: ["apple","banana","orange","melon"]
// });

newSurvey(SURVEYDATA);

app.listen(PORT, () => {console.log(`Server running http://localhost:${PORT})"`);})
