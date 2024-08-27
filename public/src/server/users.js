const path = require('path');
const fs = require('fs');
const usersFilePath = path.resolve(__dirname, "../../../public/src/datastore/users.json")

const USERDATA = {
    username: "",
    email: "",
    id: -1,
    online: false,
    signedUpOn: "",
    completed_survey: [], // json
    inprogress_survey: [],
    chatlog: [],
}

function saveUsers(users){
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

function getUsers(){
    if (fs.existsSync(usersFilePath)) {
        const data = fs.readFileSync(usersFilePath);
        return JSON.parse(data);
    }
    else {
        const initialData = [];
        saveUsers(initialData);
        return initialData;
    }
}

function newUser({username, email}){
    const newUserInfo = {username: username, email: email};

    // no email or username
    if (!newUserInfo.username || !newUserInfo.email) {
        return [400, {status: "failed", message: "No name or email provided"}];
    }

    // confirm email is a gmail
    // if (!newUserInfo.email.includes("@gmail.com")) {
    //     return [400, {status: "failed", message: "Email must be a gmail"}];
    // }

    // if user already exist
    for (const currentUsers of getUsers()) {
        if (currentUsers.email === newUserInfo.email) {
            return [400, {status: "failed", message: "User already exists"}];
        }
    }

    const users = getUsers();

    let newUser = {
        ...USERDATA,
        username: newUserInfo.username,
        signedUpOn: new Date().toLocaleString(),
        email: newUserInfo.email,
        id: users.length + 1,
    }

    // save to database
    saveUsers([...users, newUser]);
    return [200, {status: "success", message: "User created", data: newUser}];
}

function updateUser(email, updates) {
    const users = getUsers();

    // Find the user by email
    const userIndex = users.findIndex(user => user.email === email);

    if (userIndex === -1) {
        return [404, { status: "failed", message: "User not found" }];
    }

    // Update user data
    users[userIndex] = {
        ...users[userIndex],
        ...updates
    };

    // Save the updated users array back to the file
    saveUsers(users);

    return [200, { status: "success", message: "User updated", data: users[userIndex] }];
}

function userExist(email){
    // if user already exist
    for (const currentUsers of getUsers()) {
        if (currentUsers.email === email) {
            return true;
            // return res.status(400).send({status: "failed", message: "User already exists"});
        }
    }
}

module.exports = {
    saveUsers,
    getUsers,
    newUser,
    userExist,
    updateUser,
}

