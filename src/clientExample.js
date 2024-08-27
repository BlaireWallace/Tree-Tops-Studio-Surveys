
const sendButton = document.getElementById("send");
const getButton = document.getElementById("get");
const getDrafts = document.getElementById("drafts");
const getMailId = document.getElementById("getMailId");

const mailId = document.getElementById("mailId");
const email = document.getElementById("email");
const reciever = document.getElementById("reciever");
const text = document.getElementById("bodyText");
const PORT = 8000;

getButton.addEventListener("click", async function(e){
    post(e, {uri: "mail/getUserEmail", data: {email_address: email.value}});
});

getDrafts.addEventListener("click", async function(e){
    post(e, {uri: "mail/getUserDrafts", data: {email_address: email.value}});
});

getMailId.addEventListener("click", async function(e){
    post(e, {uri: "mail/readUserMail", data: {mailId: mailId.value}});
});

sendButton.addEventListener("click", async function(e){
    post(e, {uri: "mail/sendMail", data: {message: text.value, reciever: reciever.value}});
})

// mail id ex 19070b14b6011c7f

const baseUrl = "http://localhost:" + PORT + "/";

async function post(e, parcel){
    if (!parcel){ console.log("Can not post without data"); return }

    if (!parcel.referesh){ e.preventDefault();}

    const res = await fetch(baseUrl + (parcel.uri || ""),
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json", 
            },
            body: JSON.stringify({
                data: parcel.data || null // data
            })
        }
    )
    return await res.json();
}

async function get(e, uri, refreshPage){
    if (!refreshPage && e){ e.preventDefault();}
    const res = await fetch(baseUrl + (uri || ""),
            {
                method: "GET",
            }
        )
    if (!res.ok){ console.log("Error"); return }
    return await res.json();
}

console.log("Client loaded");