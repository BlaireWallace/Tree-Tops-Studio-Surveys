import { post, get } from "../../src/cleintRequest.js"
import {clientData, transferData, saveData, getData, getTransferData, removeTransferToSignal} from "../tools/localData.js"
import * as htmlTools from "../tools/htmlTools.js"

const continueButton = document.getElementById("continueButton");
const signInButton = document.getElementById("signIn");
const confirmationCode = document.getElementById("confirmationCode");
const expirationText = document.getElementById("expirationText");
const resendCode = document.getElementById("resendCode");
const rememberMeDiv = document.getElementById("rememberMeDiv");
const errorText = document.getElementById("errorText");

htmlTools.hideTag(signInButton);
htmlTools.hideTag(confirmationCode);
htmlTools.hideTag(expirationText);
htmlTools.hideTag(resendCode);
htmlTools.hideTag(rememberMeDiv);
htmlTools.hideTag(errorText);
htmlTools.hideTag(document.getElementById("spamTxt"))

let timeInterval = null;
let username = null;

const tData = getTransferData();

if (tData && tData.transferTo) {
    document.getElementById("transferSpanText").innerText = "You will be taken to the " + tData.transferTo + " when signed in"
}
else {
    document.getElementById("transferSpanText").style.display = "none";
}

function enableCodeConfirmation(data){
    const usernameText = document.getElementById("username").value;

    const parcel = data;
    username = usernameText;

    htmlTools.hideTag(continueButton);

    htmlTools.showTag(signInButton);
    htmlTools.showTag(confirmationCode);
    htmlTools.showTag(expirationText);
    htmlTools.showTag(document.getElementById("spamTxt"))
    htmlTools.showTag(resendCode);
    htmlTools.showTag(rememberMeDiv);

    if (parcel.resent && timeInterval) {
        clearInterval(timeInterval);
        timeInterval = null;
    }

    let time = parcel.codeExpireTime;
    expirationText.innerText = "Code expires at " + time + " seconds.";
    timeInterval = setInterval(() => {
        if (time <= 1) {
            expirationText.innerText = "Code expired";
            hideTag(signInButton);
            clearInterval(timeInterval);
            timeInterval = null;
            return;
        }
        else{
            time --;
            expirationText.textContent = "Code expires at " + time + " seconds.";
        }
        
    }, 1000)
}


// enable code confirmation
continueButton.addEventListener("click", async function(e) {
    const usernameText = document.getElementById("username").value;
    document.getElementById("waitScreen").style.display = "flex"
    // check if user exist and send conformation code to email
    const data = await post(e, {uri: "users/requestCodeConfirmation", data: {username: usernameText}},false);
    
    document.getElementById("waitScreen").style.display = "none"
    if (data.status === "success") {
        enableCodeConfirmation(data.data);
    } else {
        // send error code
        htmlTools.displayError(errorText,data.message || "Invalid creditials");
        console.log(data);
    }
})

// resend code
resendCode.addEventListener("click", async function(e) {
    document.getElementById("waitScreen").style.display = "flex"
    const result = post(e, {uri: "users/requestCodeConfirmation", data: {username: username, type: "resend"}},false);
    result.then((data) => {
        document.getElementById("waitScreen").style.display = "none"
        if (data.status === "success") {
            enableCodeConfirmation(data.data);
        }
    })
})

// confirm code
signInButton.addEventListener("click", async function(e) {
    if (!username){
        // conformation code has not been initiated
        return;
    }
    const code = document.getElementById("confirmationCode").value;
    // check if user exist and send conformation code to email
    const result = post(e, {uri: "users/testConformationCode", data: {username: username, code: code}},false);
    
    // login successful
    result.then((data) => {
        if (data.status === "success") {
            const rememeberMeCheckBox = document.getElementById("rememberMe");
            const user = data.data.email;
            const userId = data.data.id;

            saveData(clientData,{rememberMe: rememeberMeCheckBox.checked, email: user, id: userId, online: true, name: data.data.name});
            // redirect to home
            username = null;
            removeTransferToSignal();

            if (tData && tData.transferTo && tData.transferTo === "survey"){
                // go to survey site
                window.location.href = "quiz.html";
                return
            }
            window.location.href = "index.html";
        }
        else {
            console.log(data);
            htmlTools.displayError(errorText,data.message || "Invalid creditials");
        }
    })
})