// import { findUserWithEmail } from "./localData";

export function hideTag(tag){
    tag.classList.add("hidden");
    tag.classList.remove("visible");

    if (tag.children.length > 0) {
        for (const child of tag.children) {
            hideTag(child);
        }
    }
}

export function showTag(tag, str){
    tag.classList.add(str || "visible");
    tag.classList.remove("hidden");

    if (tag.children.length > 0) {
        for (const child of tag.children) {
            showTag(child);
        }
    }
}

export function displayError(tag,str){
    tag.innerText = str;
    showTag(tag);
}

export function hideWidget(tag){
    tag.classList.add("hidden");
    tag.classList.remove("visible");
}

export function showWidget(tag, name){
    tag.classList.add(str || "visible");
    tag.classList.remove("hidden");
}

function loginAsGuest(info){
    if (info[0]){
        // hideTag(header.querySelector("#welcomeBackText"));
        info[0].style.display = "none";
    }

    if (info[1]){
        info[1].style.display = "";
    }

    if (info[2]){
        info[2].style.display = "";
    }

    if (info[3]){
        info[3].style.display = "";
    }

    if (info[4]){
        info[4].style.display = "none";
    }

    if (info[5]){
        info[5].style.display = "none";
    }

    console.log("Log in as guest");
}

export async function updateWebsiteHeader(localStorageData, header, getUserWithEmail){
    const widgets = [
        header.querySelector("#welcomeBackText"),
        header.querySelector("#signin"),
        header.querySelector("#signup"),
        header.querySelector("#home"),
        header.querySelector("#logout"),
        header.querySelector("#messages"),
    ]

    header.querySelector("h1").innerText = "Tree Tops Questionare"

    if (localStorageData.rememberMe || localStorageData.online) {
        // check if user exist
        const user = await getUserWithEmail(localStorageData.email);

        if (user) {
            if (widgets[0]){
                header.querySelector("#welcomeBackText").style.display = "block";
                // showTag(welcomeBackText, "block");
                header.querySelector("#welcomeBackText").textContent = "Welcome back " + user.username + "!";
            }

            if (widgets[1]){
                header.querySelector("#signin").style.display = "none";
            }

            if (widgets[2]){
                header.querySelector("#signup").style.display = "none";
            }

            if (widgets[3]){
                header.querySelector("#home").style.display = "";
            }

            if (widgets[4]){
                header.querySelector("#logout").style.display = "";
            }

            if (widgets[5]){
                header.querySelector("#messages").style.display = "none";
            }

            console.log("Log in as user: " , user);

            return "user";
        }
        else {
            loginAsGuest(widgets)
            return "guest";
        }
        
    }
    else {
        // show as unLogined user
        loginAsGuest(widgets);
        return "guest";
    }
}