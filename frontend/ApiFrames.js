const BACKEND_URL = "https://script.google.com/macros/s/AKfycbyVEMBqoApPG_0rD9cp5nL9DhJaNiKgviIn4kA3jZI6yztz6mRWBGHFIPOxlu3xMsaK/exec";

let api = {
    login: (callback) => sendRequest('L', [], callback),
    listSheets: (callback) => sendRequest('LS', [], callback)
};

const requestCallbacks = {}; // {id: callback}

function sendRequest(request, parameters, callback, id) {
    let query = new URLSearchParams();
    query.set("r", request);
    for (var p in parameters) {
        query.append("p", p);
    }
    if (!callback) callback = (r) => console.log("Response without callback: " + r);
    if (!id) id = crypto.randomUUID();
    const existing_callback = requestCallbacks[id];
    if (existing_callback) {
        // tack on to the existing request
        requestCallbacks[id] = function(r) {
            existing_callback(r);
            callback(r);
        }
    } else {
        // send a new request
        requestCallbacks[id] = callback;
        const apiframe_id = "apiFrame_" + id;
        const apiframe = document.createElement("iframe");
        apiframe.id = apiframe_id;
        apiframe.style = "position: absolute; width:0; height:0; border:0;";
        document.body.appendChild(apiframe);
        apiframe.onload = function() {
            window.setTimeout(function() {
                handleResponse(id, null); // if no message received
            }, 1000); // 1s after frame loads
        };
        apiframe.src = BACKEND_URL + "?id=" + id + "&" + query.toString();
    }
}

window.top.addEventListener('message', onMessage);

function onMessage(e) {
    if (e.data.response) {
        if (e.data.id) {
            handleResponse(e.data.id, e.data.response);
        } else {
            console.error("Response without id: " + e.data.response);
        }
    } else if (e.data.error) {
        console.error("Error for id '" + e.data.id + "': " + e.data.error);
    } else {
        console.error("Empty message: " + e.data);
    }
}

function handleResponse(id, response) {
    const callback = requestCallbacks[id];
    if (callback) {
        delete requestCallbacks[id];
        const apiframe_id = "apiFrame_" + id;
        document.getElementById(apiframe_id).remove();
        if (response) {
            callback(response);
        } else {
            console.log("No message received, the user probably isn't logged in.");
            //TODO show login screen
        }
    }
}
