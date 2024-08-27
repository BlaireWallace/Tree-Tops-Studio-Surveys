import { post, get } from "../../src/cleintRequest.js"
import {clientData, transferData, saveData, getData, getTransferData, removeTransferToSignal} from "../tools/localData.js"
import * as htmlTools from "../tools/htmlTools.js"

const continueButton = document.getElementById("continueButton");
const signUpButton = document.getElementById("signUp");
const confirmationCode = document.getElementById("confirmationCode");
const expirationText = document.getElementById("expirationText");
const resendCode = document.getElementById("resendCode");
const errorText = document.getElementById("errorText");

htmlTools.hideTag(confirmationCode);
htmlTools.hideTag(expirationText);
htmlTools.hideTag(resendCode);
htmlTools.hideTag(errorText);
htmlTools.hideTag(signUpButton);
htmlTools.hideTag(document.getElementById("spamTxt"))

const tData = getTransferData();
if (tData && tData.transferTo) {
    document.getElementById("transferSpanText").innerText = "You will be taken to the " + tData.transferTo + " when signed up"
}
else {
    document.getElementById("transferSpanText").style.display = "none";
}

let usernameTemp = null;
let emailTemp = null;
let timeInterval = null;

function enableCodeConfirmation(data){
    const usernameText = document.getElementById("username").value;
    const emailText = document.getElementById("email").value;

    const parcel = data.data || data;
    usernameTemp = usernameText;
    emailTemp = emailText;

    htmlTools.hideTag(continueButton);
    htmlTools.hideTag(errorText);

    htmlTools.showTag(signUpButton);
    htmlTools.showTag(confirmationCode);
    htmlTools.showTag(expirationText);
    htmlTools.showTag(resendCode);
    htmlTools.showTag(document.getElementById("spamTxt"))

    if (parcel.resent && timeInterval) {
        clearInterval(timeInterval);
        timeInterval = null;
    }
    let time = parcel.codeExpireTime;
    expirationText.textContent = "Code expires at " + time + " seconds";
    timeInterval = setInterval(() => {
        if (time <= 1) {
            expirationText.textContent = "Code expired";
            htmlTools.hideTag(signUpButton);
            clearInterval(timeInterval);
            timeInterval = null;
            return;
        }
        else{
            time --;
            expirationText.textContent = "Code expires at " + time + " seconds";
        }
        
    }, 1000)
}

continueButton.addEventListener("click", async function(e){
    const usernameText = document.getElementById("username").value;
    const emailText = document.getElementById("email").value;

    document.getElementById("waitScreen").style.display = "flex"

    const result = post(e,{uri:"users/requestCodeConfirmation", data: {
        username: usernameText,
        email: emailText,
        newUser: true,
    }}, false)

    result.then((data) => {
        document.getElementById("waitScreen").style.display = "none"
        if (data.status !== "success"){
            htmlTools.displayError(errorText,data.message || "Invalid creditials");
        }
        else{
            enableCodeConfirmation(data);
        }
    })
})

resendCode.addEventListener(("click"), async function(e){
    document.getElementById("waitScreen").style.display = "flex"
    const result = post(e, {uri: "users/requestCodeConfirmation", data: {username: usernameTemp, email: emailTemp, type: "resend", newUser: true}},false);
    result.then((data) => {
        document.getElementById("waitScreen").style.display = "none"
        if (data.status === "success") {
            enableCodeConfirmation(data.data);
        }
        else{
            console.log(data);
        }
    })
})

signUpButton.addEventListener(("click"), async function(e){
    if (!usernameTemp || !emailTemp){
        // conformation code has not been initiated
        e.preventDefault();
    }
    else{ 
        const code = document.getElementById("confirmationCode").value;
        // check if user exist and send conformation code to email
        const result = post(e, {uri: "users/testConformationCode", data: {name: usernameTemp, code: code, newUser: true, email: emailTemp}},false);
        // login successful
        result.then((data) => {
            if (data.status === "success") {
                const rememeberMeCheckBox = false;
                const userEmail = data.data.email;
                const userName = data.data.username;
                const userId = data.data.id;
                saveData(clientData, {rememberMe: rememeberMeCheckBox, email: userEmail, id: userId, online: true, name: userName});
                // redirect to home
                usernameTemp = null;
                emailTemp = null;

                removeTransferToSignal();

                if (tData && tData.transferTo && tData.transferTo === "survey"){
                    // go to survey site
                    window.location.href = "quiz.html";
                    return
                }
                window.location.href = "index.html";

            }
            else {
                
                console.log(data)
                htmlTools.displayError(errorText,data.message || "Invalid creditials");
            }
        })
    }
})