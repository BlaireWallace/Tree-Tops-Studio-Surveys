const path = require('path');
const fs = require('fs');
const { libraryagent } = require('googleapis/build/src/apis/libraryagent');
const { getUsers } = require("./users")
const { sendMail } = require("../tools/gmail_");
const { da } = require('date-fns/locale/da');
const filePath = path.resolve(__dirname, "../../../public/src/datastore/surveys.json")
require("dotenv").config();

const SURVEYDATA = {
    name: "",
    published: "", // Date Time Year Format
    completed: 0, // how many times a user completes it
    id: -1,
    isPrivate: false,
    active: true,
    survey_code: "", // if survey is private
    survey_passcode: "", // (optional)
    questions: [], // i/v
}

// Quiz types:
// Multiple choice, open ended, multiple choice with open ended, least likely more likely

const QUESTION = {
    type: null,
    name: "",
    image: "", // if any
    data: null, // questionType
}

const QUESTIONTYPE = {
    multiple: {
        // data: {}, //i,v
        open_ended: false,
        open_ended_msg: "",
    },
    selection: {
        // answer: {}, //i,v
    },
    open: {
        // answer: "", // string
    }, 
    likely: {
        // answer: null // true of false (more likely, least likely)
    },
}

function toString(json){
    
}

function save(data){
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getSurveys(){
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        return JSON.parse(data);
    }
    else {
        const initialData = [];
        save(initialData);
        return initialData;
    }
}

function updateSurvey(surveyId, updatedData) {
    const surveys = getSurveys(); // Load existing surveys
    const surveyIndex = surveys.findIndex(survey => survey.id === surveyId); // Find the survey by ID

    if (surveyIndex !== -1) {
        // Update the survey with the new data
        surveys[surveyIndex] = { ...surveys[surveyIndex], ...updatedData };

        // Save the updated surveys back to the file
        save(surveys);
    } else {
        console.log(`Survey with ID ${surveyId} not found.`);
    }
}

function newSurvey(data){
    const surveys = getSurveys();

    for (const s of surveys) {
        if (s.name === data.name) {
            console.log("Survey already exist!")
            return {status: "failed", message: "Survey already exist"};
        }
    }

    if (data.questions.length == 0) {
        console.log("There are no questions for this survey!");
        return {status: "failed", message: "No questions in survey"};
    } 
    
    data.id = surveys.length + 1
    data.published = new Date().toLocaleString()
    save([...getSurveys(), data]);

    // get all users and notify that theres a new survey uploaded
    if (process.env.SEND_EMAILS === "true"){
        for (const i in getUsers()){
            const user = getUsers()[i]
            sendMail(user.email,
            "[" +  process.env.WEBSITE_NAME + "] New Survey!",
            "A new server has been added! [" + data.name + "] Take some time to complete it :)"
            )
        }
    }

    return {status: "success", message: "Survey created!"}
}

function newQuestion(surveyData, data){
    if (data == null){
        console.log("question does not exist!");
        return;
    }

    if (!data.type || !QUESTIONTYPE[data.type]){
        console.log("Type does not exist!");
        return;
    }

    if (!data.name || data.name === ""){
        console.log("Question name does not exist! ");
        return;
    }

    if (!data.data && data.type != "open"){
        console.log("Question data does not exist! " + data.data + data.type);
        return;
    }

    for (let i=0; i<surveyData.questions.length; i++){
        if (surveyData.questions[i].questionName === data.name){
            console.log("Can not have duplicate question! " + data.data + " " + surveyData.questions[i].questionName);
            return;
        }
    }
    const questionData = {...QUESTIONTYPE[data.type], ...data};
    surveyData.questions.push(questionData);
}

module.exports = {
    SURVEYDATA,
    QUESTION,
    QUESTIONTYPE,
    getSurveys,
    newSurvey, 
    newQuestion,
    updateSurvey,
}