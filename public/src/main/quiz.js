import { post } from "../cleintRequest.js";
import * as htmlTools from "../tools/htmlTools.js";
import {clientData, getTransferData , getData , findUserWithEmail, removeData } from "../tools/localData.js";
import * as localData from "../tools/localData.js";

const warningScreen = document.getElementById("warningScreen");
const submissionScreen = document.getElementById("waitScreen");
const quizScreen = document.getElementById("quizScreen");
let timeStarted = null;

const questionTypes = {
    "open": quizScreen.querySelector(".response"),
    "multiple": quizScreen.querySelector(".radio"),
    "selection": quizScreen.querySelector(".checkbox"),
    "answeredQuestion": quizScreen.querySelector(".answeredResponse")
}

const user_ = getData(clientData);
const userStatus = await htmlTools.updateWebsiteHeader(user_,document.querySelector("header"),findUserWithEmail);

let surveyInput = null;
let surveyData = null;
let logoutAttempt = false;

// hide widgets
for (const typeName in questionTypes){
    questionTypes[typeName].style.display = "none";
}

function createQuestionBox(name,q, questionId){
    let frame = null;
    const responseButton = document.getElementById("responseButtons");
    if (surveyData.type !== "completed"){
        frame = questionTypes[name].cloneNode(true);    
        if (frame.querySelector(".secretResponseText")){
            frame.querySelector(".secretResponseText").addEventListener("input", function(e){
                surveyInput[questionId].answer["open_ended_msg"] = frame.querySelector(".secretResponseText").value;
            });
        }
    }
    else if (surveyData.type === "completed") {
        frame = questionTypes["answeredQuestion"].cloneNode(true);
    }
    frame.style.display = "flex";
    frame.querySelector(".questionPromt").innerText = q.name || "Error";
    frame.querySelector(".questionNumber").innerText = parseInt(questionId) + 1;
    quizScreen.insertBefore(frame,responseButton);
    return frame
}

function createQuestionMultipleBox(questionId, frame, q, userData){
    let userQuestionInput = userData ? userData.survey[questionId] : null;

    if (surveyData.type !== "completed"){
        let data = [];
        const contents = frame.querySelector("#questionContents");
        // hide pre contents
        for (const index in contents.children){
            if (Number.isInteger(parseInt(index))){
                frame.querySelector("#questionContents").children[index].style.display = "none";
            }
        }

        const box = frame.querySelector("#questionButton");
        const secretText = frame.querySelector(".secretResponseText");

        if (secretText){
            secretText.style.display = "none";
        }

        function radioClicked(answer,secretMsg){
            surveyInput[questionId].answer = answer;
            // radio checked update surveyInput
            for (const i in data){
                // uncheck other radios
                const d = data[i].querySelector(".responseRadio");
                d.checked = data[i].querySelector(".optionButton").innerText === answer;
                // secret message logic
                if (q.open_ended && q.data.length -1 == i && d.checked || secretMsg) {
                    if (secretText){
                        secretText.style.display = "flex";
                        surveyInput[questionId].answer = {
                            open_ended: true,
                            question: answer,
                            open_ended_msg: "",
                        }

                        if (secretMsg){
                            secretText.value = secretMsg;
                            surveyInput[questionId].answer["open_ended_msg"] = secretMsg;
                        }
                    }
                }
                else{
                    if (secretText){
                        secretText.style.display = "none";
                        secretText.value = "";
                    }
                }
            }
        }

        function selectionClicked(answer,e){
            // initiate array if not added
            if (!surveyInput[questionId].answer){
                surveyInput[questionId].answer = [];
            }

            const s = answer;
            let status = "none";

            if (surveyInput[questionId].answer.includes(s)){
                // remove
                surveyInput[questionId].answer = surveyInput[questionId].answer.filter(item => item !== answer);
                status = "remove";
            }
            else {
                // add
                surveyInput[questionId].answer.push(answer);
                status = "add";
            }

            for (const i in data){
                if (!e && data[i].querySelector(".optionButton").innerText === answer){
                    data[i].querySelector(".responseRadio").checked = !data[i].querySelector(".responseRadio").checked;
                }
            }
        }

        for (const index in q.data){
            const qb = box.cloneNode(true);
            const button = qb.querySelector(".responseRadio");
            qb.querySelector(".optionButton").innerText = q.data[index];

            qb.style.display = "flex";    
            qb.setAttribute("qestionNum", questionId);    
            frame.insertBefore(qb, secretText);

            data.push(qb);

            // radio logic
            if (button.type == "radio"){
                button.addEventListener("change", (e) => {
                radioClicked(qb.querySelector(".optionButton").innerText);
                })
            }
            // selection logic
            else if (button.type == "checkbox"){
                button.addEventListener("change", (e) => {
                    selectionClicked(qb.querySelector(".optionButton").innerText,e);
                })
            }
        }

        function isObject(value) {
            return typeof value === 'object' && value !== null && !Array.isArray(value);
        }

        // pre load question
        if (userQuestionInput){
            let answer = null;

            if (userQuestionInput.name === "multiple question"){
                let openEndedMsg = null
                if (typeof userQuestionInput.answer === "string"){
                    answer = userQuestionInput.answer;
                }
                else if (isObject(userQuestionInput.answer)){
                    answer = userQuestionInput.answer.question;
                }
                if (userQuestionInput.answer && userQuestionInput.answer.open_ended_msg){
                    openEndedMsg = userQuestionInput.answer.open_ended_msg;
                }

                radioClicked(answer, openEndedMsg);
            }

            else if (userQuestionInput.name === "selection question"){
                answer = userQuestionInput.answer;
                for (const i in answer){
                    selectionClicked(answer[i]);
                }
            }        
        }
        return data;
    }    
    else {
        //completed
    }
}


function open(questionId, q, userData){
    const frame = createQuestionBox("open", q, questionId);
    const userQuestionInput = userData ? userData.survey[questionId] : null;

    if (userQuestionInput !== null && userQuestionInput.answer){
        surveyInput[questionId].answer = userQuestionInput.answer;

        if (surveyData.type !== "completed"){
            frame.querySelector("#responseText").value = userQuestionInput.answer;
        }
        else {
            frame.querySelector("#responseText").innerText = userQuestionInput.answer;
        }
    }

    frame.querySelector("#responseText").addEventListener("input", (e) =>{
        surveyInput[questionId].answer = frame.querySelector("#responseText").value;
    })
    return frame;
}

function multiple(questionId, q, userData){
    const frame = createQuestionBox("multiple",q,questionId);
    createQuestionMultipleBox(questionId, frame, q, userData);
    const b = "•";
    const userQuestionInput = userData ? userData.survey[questionId] : null;
    if (userQuestionInput !== null && userQuestionInput.answer && surveyData.type === "completed"){
        // survey completed
        if (typeof userQuestionInput.answer === "object"){
            frame.querySelector("#responseText").style.lineHeight = 2;
            frame.querySelector("#responseText").innerText = userQuestionInput.answer.question + " \n  \"" + (userQuestionInput.answer.open_ended_msg || "N/A") + "\"";
        }
        else {
            frame.querySelector("#responseText").innerText = userQuestionInput.answer;
        }
    }
    return frame;
}

function selection(questionId, q, userData){
    const frame = createQuestionBox("selection",q,questionId);
    createQuestionMultipleBox(questionId,frame, q, userData);

    const userQuestionInput = userData ? userData.survey[questionId] : null;
    if (userQuestionInput !== null && userQuestionInput.answer && surveyData.type === "completed"){
        // survey completed
        frame.querySelector("#responseText").style.lineHeight = 2;
        let s = "";
        for (const i in userQuestionInput.answer){
            s += "- " + userQuestionInput.answer[i] +"\n";
        }
        frame.querySelector("#responseText").innerText = s;
    }
    return frame;
}

const questionFunctions = {
    "open": open,
    "multiple": multiple,
    "selection": selection,
}

// submission 
async function submit(e){
    // guest is taking the survey (for now, exit without saving)
    if (userStatus === "guest") {
        window.location.href = "index.html";
        return
    };

    // check if all of the questions are answered
    let notCompletedQuestions = []; // question number
    for (const i in surveyInput){
        const data = surveyInput[i];
        if (data.answer == null) {
            notCompletedQuestions.push(parseInt(i));
        }
        else if (typeof data.answer == "string" && data.answer.length == 0){
            notCompletedQuestions.push(parseInt(i));
        }
        else if (data.answer.open_ended && data.answer.open_ended_msg.length == 0){
            notCompletedQuestions.push(parseInt(i));
        }
        else if (Array.isArray(data.answer) && data.answer.length == 0){
            notCompletedQuestions.push(parseInt(i));
        }
    }

    for (const i in surveyInput){
        surveyInput[i].frame.querySelector("#questionNotAnswered").style.display = "none";
    }
    

    if (notCompletedQuestions.length > 0) {
       
        // display the questions that are not completed
        console.log("Survey not completed ");
        window.scrollTo(0,0);
        for (const e in notCompletedQuestions){
            if (surveyInput[notCompletedQuestions[e]]){
                surveyInput[notCompletedQuestions[e]].frame.querySelector("#questionNotAnswered").style.display = "flex";
            }
        }
        return;
    }

    const user_ = getData(clientData);

    if (!user_ || !user_.email){
        console.log("User does not exist");
        return;
    }

    // show submission screen 
    submissionScreen.style.display = "flex";

    // await new Promise(resolve => setTimeout(resolve,5000))

    // submit
    const result = post(e,{uri:"surveys/postUserSurvey", data: {
        survey: surveyInput,
        surveyId: surveyData.data.id,
        name: surveyData.data.name,
        user: user_,
        timeStarted: timeStarted,
    }},false);

    result.then((data) => {
        if (data.status != "success") {
            // display error
            return;
        }
        // save successful go home
        window.location.href = "index.html";
    })

}

function openExitTicket(){
    if (surveyData.type === "completed"){
        // go home
        if (logoutAttempt){
            // logout
            localData.logout();
        }
        window.location.href = "index.html";
        return;
    }

    // guest is taking the survey
    if (userStatus === "guest"){
        window.location.href = "index.html";
        return
    }

    if (user_ && user_.email || surveyData.data.isPrivate === true){
        // user exist or survey is private
        // warningScreen.style.display = "flex";
    }
    warningScreen.style.display = "flex";

    if (surveyData.data.isPrivate === true){
        // user does not exist change text
    }
}

function closeExitTicket(){
    logoutAttempt = false;
    warningScreen.style.display = "none";
}

// load quiz
function loadQuiz(){
    surveyData = getTransferData(true);
    if (!surveyData){
        return;
    }

    surveyData = surveyData.data;

    let userSurvey = surveyData.userData;
    let survey = surveyData.data;
    timeStarted = userSurvey?.startedOn ?? new Date().toLocaleString();
    console.log("User Survey:" , userSurvey , " \n Survey Data:", surveyData);

    surveyInput = {};

    document.getElementById("quizTitle").innerText = survey.name;

    const userProgressScreen = document.getElementById("userProgressScreen");
    userProgressScreen.style.color = "white"
    switch (surveyData?.type ?? "none"){
        case "completed":
            userProgressScreen.innerText = "Survey started on: " + timeStarted + " \nSurvey completed on: " + userSurvey.completedOn;
            break;
        case "inProgress":
            userProgressScreen.innerText = "Quiz is currently in progress \n Survey started on: " + timeStarted ;
            break;
        default: // normal survey
        userProgressScreen.style.display = "none";
    }

    // load questions
    for (const index in survey.questions){
        const question = survey.questions[index];

        if (questionFunctions[question.type]) {
            surveyInput[index] = {
                name: question.name,
                answer: null, 
            }; // key is question number, value is information
            surveyInput[index]["frame"] = questionFunctions[question.type](index,question,userSurvey);
        }
    }

    // completed survey logic
    if (surveyData.type === "completed"){
        document.getElementById("submitButton").style.display = "none";
        document.getElementById("finishlaterButton").style.display = "none";
    }
    else {
        document.getElementById("homeButton").style.display = "none";
    }

    document.getElementById("homeButton").addEventListener("click", function(e){
        e.preventDefault();
        // go home
        window.location.href = "index.html";
    })

    // submission
    document.getElementById("submitButton").addEventListener("click", function(e){
        e.preventDefault();
        submit(e);
    })

    document.getElementById("finishlaterButton").addEventListener("click", function(e){
        e.preventDefault();
        // include confromation
        openExitTicket();
    })

    document.querySelector("header").querySelector("#home").addEventListener("click", function(e){
        e.preventDefault();
        openExitTicket();
    })

    document.querySelector("header").querySelector("#logout").addEventListener("click", function(e){
        e.preventDefault();
        logoutAttempt = true;
        openExitTicket();
    })

    warningScreen.querySelector("#leavePage").addEventListener("click", async function(e){
        e.preventDefault();
        // leave page

        if (userStatus === "guest") {return};

        if (user_ && user_.email) {
            // finish later (submit)
            const result = await post(e,{uri:"surveys/saveUserSurvey", data: {
                survey: surveyInput,
                surveyId: surveyData.data.id,
                name: surveyData.data.name,
                user: getData(clientData),
                timeStarted: timeStarted,
            }},false);
        
            if (result.status != "success") {
                // display error
                return;
            }
            if (logoutAttempt){
                localData.logout();
            }
            // save successful go home
            window.location.href = "index.html";
        }
        else{ // do not save user does not exist
            if (logoutAttempt){
                // logout
                localData.logout();
            }
            window.location.href = "index.html";
        }
    })

    warningScreen.querySelector("#stayOnPage").addEventListener("click", function(e){
        e.preventDefault();
        closeExitTicket()
    })

    // console.log("Survey Input: \n" , surveyInput);
}

loadQuiz();