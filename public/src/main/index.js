const HomeButton = document.getElementById("home");
const SignInButton = document.getElementById("signin");
const LogoutButton = document.getElementById("logout");
const MessagesButton = document.getElementById("messages");

import * as localData from "../tools/localData.js"

const buttonsList = {
    "home": "index.html",
    "signin": "signIn.html",
    "signup": "signUp.html",
    "logout": "index.html",
    "messages": "messages.html"
}

function logoutUser(){
    // redirect to home
    localData.logout();
}

// main fucntions
function redirect(name, uri){
    if (name === "logout") {
        logoutUser();
    }
    localStorage.clear();
    window.location.href = uri
}

for (const [key, value] of Object.entries(buttonsList)) {
    const button = document.getElementById(key);
    if (button != null) {
        button.addEventListener("click", () => redirect(key, value))
    }
}
