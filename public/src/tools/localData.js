// import { getDate } from "date-fns";

import { post, get } from "../cleintRequest.js"

export const clientData = "clientData";
export const transferData = "transferData"

const dataTable = {
    [clientData]: {
        rememberMe: false, // boolean
        name: null,
        email: null,
        id: null,
        online: false,
    },
    [transferData]: {
        
    }
}

export function saveData(name, info) {
    if (!info){
        removeData(name);
        return;
    }
    const currentData = getData(name);
    if (!currentData){
        console.log("Can not save data when the name KEY does not exist!")
        return;
    }
    let data = { ...currentData, ...info};
    try {
        localStorage.setItem(name, JSON.stringify(data));
        return { status: "success", "data": data };
    } catch (error) {
        return sendError(error);
    }
}

export function getData(name) {
    try {
        const data = localStorage.getItem(name);
        if (data) {
            return JSON.parse(data);
        } else {
            return dataTable[name]; // default values; // or some default value
        }
    } catch (error) {
        return sendError(error);
    }
}

export function toggleOnlineStatus(status){
    saveData(clientData, {online: status});
}

export function removeData(name) {
    localStorage.removeItem(name);
}

export function getTransferData(){
    const data = getData(transferData);
    return data;
}

export function removeTransferToSignal(){
    saveData(transferData,{
        transferTo: null,
    })
}

export function removeTransferData(){
    removeData(transferData);
}

export async function findUserWithEmail(email){
    const result = get(null,"users",false);
    try {
        const data = await result;
        if (data && data.users) {
            const user = data.users.find(item => item.email === email);
            return user;
        }
        else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

export function logout(){
    localStorage.clear()
}

function sendError(error) {
    return { status: "error", message: error.message };
}
