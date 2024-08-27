let logined = false;
let quizItems = {};
import * as htmlTools from "../tools/htmlTools.js"

const surveys = document.getElementById("surveys");
const surveyApplication = document.getElementById("QuizSelection");
surveyApplication.style.display = "none";
surveyApplication.querySelector(".quizButton").style.display = "none";
// htmlTools.hideTag(surveyApplication.querySelector(".quizButton"));

// elements
const header = document.querySelector("header");
const HomeButton = document.getElementById("home");
const SignInButton = document.getElementById("signin");
const SignUpButton = document.getElementById("signup");
const LogoutButton = document.getElementById("logout");
const MessagesButton = document.getElementById("messages");

// other elements
const welcomeBackText = document.getElementById("welcomeBackText");

// auto login logic
import {clientData, transferData, saveData, getData, toggleOnlineStatus, removeData, findUserWithEmail} from "../tools/localData.js"
import { post, get } from "../../src/cleintRequest.js"

const localStorageData = getData(clientData);
// load quizzes

async function getUsers(){
    const result = get(null,"users",false);
    return result;
}

create("Avaliable Surveys")

const userStatus = await htmlTools.updateWebsiteHeader(localStorageData, header, findUserWithEmail);
if (userStatus === "guest"){
    loginAsGuest();
}
else if (userStatus === "user"){
    loginUser();
}

function createSurveyButton(survey,clone, placeBefore){

    const quizButton = clone.querySelector(".quizButton").cloneNode(true);
    quizButton.innerText = survey.name;
    const quizContent = clone.querySelector("#quizContent");

    quizButton.setAttribute("data-priority", placeBefore ? 2 : 1);
    const newPriority = parseInt(quizButton.getAttribute('data-priority'));

    const widgets = Array.from(clone.querySelector("#quizContent").children);

    // place button 
    if (widgets.length !== 0){
        let added = false;
        for (const i in widgets){
            added = false;
            const currentPriority = parseInt(widgets[i].getAttribute("data-priority"));
    
            if (newPriority < currentPriority) {
                added = true;
                quizContent.insertBefore(quizButton, widgets[i]);
                break;
            }
        }

        if (!added){
            quizContent.appendChild(quizButton);
        }
    }
    else {
        quizContent.appendChild(quizButton);
    }


    quizButton.style.display = "block";

    quizButton.addEventListener(("click"), async function(){
        // go to the surveys page and begin survey if logged in
        saveData(transferData,{
            "data": survey,
        })

        if (userStatus === "guest" && survey.data.isPrivate === false) {
            // make guest to sign in if survey isnt private
            saveData(transferData,{
                "data": survey,
                transferTo: "survey",
            })
            window.location.href = "signIn.html"
            return;
        }
        // go to quiz,
        window.location.href = "quiz.html";
    })
}


// we will manage surveys if the user has finished, in progress surverys
async function create(str){
    let clone = surveyApplication.cloneNode(true);
    const user = await findUserWithEmail(localStorageData.email);
    clone.querySelector("p2").textContent = str;
    surveys.appendChild(clone);
    clone.style.display = "";
    quizItems[str] = clone;

    const allSurveys = await get(null, "surveys", true);
    
    if (allSurveys.status != "success") {
        return;
    }

    // create avaliable survey buttons
    if (str === "Avaliable Surveys") {
        // if user exist get the users completed surverys and surveys in progress
        
        for (const index in allSurveys.data) {
            const int = parseInt(index);
            const survey = allSurveys.data[parseInt(index)];
            const surveyData = {
                type: "normal",
                data: survey,
                name: survey.name,
            }

            if (survey.active === true && survey.isPrivate === false){
                // check if the user has already finish this survey if so then place it under
                if (user && user.completed_survey.find(index => index.id === survey.id)){
                    createSurveyButton(surveyData,clone,true);
                }
                else{
                    createSurveyButton(surveyData,clone);
                }
            }
        }
    }

    // get users data and get surveys
    if (str === "Surveys in Progress"){
        if (user) {
            for (const i in user.inprogress_survey){
                const survey = user.inprogress_survey[i];
                const currentSurvey = allSurveys.data.find(index => index.id === survey.id);
                const surveyData = {
                    type: "inProgress",
                    userData: survey,
                    data: currentSurvey,
                    name: survey.name,
                }
                createSurveyButton(surveyData,clone);
            }
        }
    }
    
    if (str === "Completed Surveys"){
        if (user) {
            for (const i in user.completed_survey){
                const survey = user.completed_survey[i];
                const currentSurvey = allSurveys.data.find(index => index.id === survey.id);
                const surveyData = {
                    type: "completed",
                    userData: survey,
                    data: currentSurvey,
                    name: survey.name,
                }
                createSurveyButton(surveyData,clone);
            }
        }
    }
}

function loginUser(info){
    create("Surveys in Progress");
    create("Completed Surveys");     
}

function logoutUser(){
    // redirect to home
    removeData(clientData);
    removeData(transferData);
    location.reload();
}

function loginAsGuest(){
    removeData(clientData);
}

LogoutButton.addEventListener("click", logoutUser);
