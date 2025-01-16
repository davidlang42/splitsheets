const BACKEND_URL = "https://script.google.com/macros/s/AKfycbyVEMBqoApPG_0rD9cp5nL9DhJaNiKgviIn4kA3jZI6yztz6mRWBGHFIPOxlu3xMsaK/exec";
const IFRAME_PREFIX = "apiFrame_";

let api = {
  login: (callback) => sendRequest('login', [], callback), // returns the email of the current user
  listSheets: (callback) => sendRequest('listSheets', [], callback), // returns known sheets as {id: name}
  addSheet: (sheet_id, name, callback) => sendRequest('addSheet', [sheet_id, name], callback), // adds or renames a sheet to the list of known sheets, if no name is provided it will open the spreadsheet and get its actual name, then returns the updated list of sheets
  removeSheet: (sheet_id, callback) => sendRequest('removeSheet', [sheet_id], callback), // removes a sheet from the list of known sheets, and returns the updated list of sheets
  createSheet: (name, callback) => sendRequest('createSheet', [name], callback), // creates a new sheet from the template, adds it to the list of known sheets, and returns the updated list of sheets
  addCost: (sheet_id, date, description, amount, paid_by, paid_for, split, callback) => sendRequest('addCost', [sheet_id, date, description, amount, paid_by, paid_for, split], callback), // append a new cost row to the given sheet
  listBalances: (sheet_id, callback) => sendRequest('listBalances', [sheet_id], callback), // return balances from a given sheet as {email: owed}
};

const requestCallbacks = {}; // {id: callback}

function sendRequest(request, parameters, callback, id) {
  let query = new URLSearchParams();
  query.set("r", request);
  for (const p of parameters) {
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
    const apiframe_id = IFRAME_PREFIX + id;
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
    console.log("Request " + id + ": " + query.toString());
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
    console.error("Error for id '" + e.data.id + "': " + e.data.error);//TODO errors getting logged dont call handleResponse, so they dont clear the callback, so the timeout redirects to login
  } else {
    console.error("Empty message: " + e.data);
  }
}

function handleResponse(id, response) {
  const callback = requestCallbacks[id];
  if (callback) {
    delete requestCallbacks[id];
    const apiframe_id = IFRAME_PREFIX + id;
    document.getElementById(apiframe_id).remove();
    if (response) {
      console.log("Response " + id + ": " + JSON.stringify(response));
      callback(response);
    } else {
      // No message received, redirect to login
      window.top.location.href = BACKEND_URL;
    }
  }
}
