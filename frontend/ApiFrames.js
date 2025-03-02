const BACKEND_URL = "https://script.google.com/macros/s/AKfycbyVEMBqoApPG_0rD9cp5nL9DhJaNiKgviIn4kA3jZI6yztz6mRWBGHFIPOxlu3xMsaK/exec";
const IFRAME_PREFIX = "apiFrame_";

let auth_count = new URLSearchParams(window.location.search).get('a') ?? 0;

let api = {
  login: (callback) => sendRequest('login', [], callback, 'login', 1000), // returns the email of the current user
  listSheets: (callback) => sendRequest('listSheets', [], callback, 'listSheets'), // returns known sheets as {id: name}
  addSheet: (sheet_id, name, callback) => sendRequest('addSheet', [sheet_id, name], callback), // adds or renames a sheet to the list of known sheets, if no name is provided it will open the spreadsheet and get its actual name, then returns the updated list of sheets
  removeSheet: (sheet_id, callback) => sendRequest('removeSheet', [sheet_id], callback), // removes a sheet from the list of known sheets, and returns the updated list of sheets
  createSheet: (name, callback) => sendRequest('createSheet', [name], callback), // creates a new sheet from the template, adds it to the list of known sheets, and returns the updated list of sheets
  addCost: (sheet_id, date, description, amount, paid_by, paid_for, split, callback) => sendRequest('addCost', [sheet_id, date, description, amount, paid_by, paid_for, split], callback), // append a new cost row to the given sheet, then return the balances as {email: owed}
  moveAmount: (date, from_sheet_id, to_sheet_id, from_email, to_email, amount, callback) => sendRequest('moveAmount', [date, from_sheet_id, to_sheet_id, from_email, to_email, amount], callback), // move an amount from one sheet to another, then return the balances of from_sheet_id as {email: owed}
  listBalances: (sheet_id, callback) => sendRequest('listBalances', [sheet_id], callback, 'listBalances_' + sheet_id), // return balances from a given sheet as {email: owed}
  listUsers: (sheet_id, callback) => sendRequest('listUsers', [sheet_id], callback, 'listUsers_' + sheet_id), // return users for a given sheet as {email: alias}
  addUser: (sheet_id, email, callback) => sendRequest('addUser', [sheet_id, email], callback), // add a user to the given sheet, then return users as {email: alias}
  removeUser: (sheet_id, email, callback) => sendRequest('removeUser', [sheet_id, email], callback), // remove a user from the given sheet, then return users as {email: alias}
  listSheetsAndUsers: (callback) => sendRequest('listSheetsAndUsers', [], callback, 'listSheetsAndUsers'), // returns known sheets as {id: {name, users}}
};

const requestCallbacks = {}; // {id: callback}

function sendRequest(request, parameters, callback, cache_id, auto_redirect_timeout) {
  if (cache_id && callback) {
    const cached_response = window.localStorage.getItem(cache_id);
    if (cached_response) {
      console.log(`Cached ${cache_id}: ${cached_response}`);
      callback(JSON.parse(cached_response));
    }
    const original_callback = callback;
    callback = function(r) {
      const new_response = JSON.stringify(r);
      if (cached_response != new_response) {
        original_callback(r);
        window.localStorage.setItem(cache_id, new_response);
      }
    }
  }
  let query = new URLSearchParams();
  query.set("r", request);
  for (const p of parameters) {
    query.append("p", p);
  }
  if (!callback) callback = (r) => console.log("Response without callback: " + r);
  const id = cache_id ?? crypto.randomUUID();
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
    const apiframe = document.createElement("iframe");
    apiframe.id = IFRAME_PREFIX + id;
    apiframe.sandbox = "allow-scripts allow-same-origin"
    apiframe.className = "apiframe";
    document.body.appendChild(apiframe);
    apiframe.onload = function() {
      window.setTimeout(function() {
        if (consumeCallback(id)) {
          // No message was received
          if (auto_redirect_timeout) {
            // Redirect to login
            window.top.location.href = BACKEND_URL + "?a=" + auth_count;
          } else if (confirm(`The server has not responded to the '${request}' request for 10s, would you like to reload the page?`)) {
            // Reload the client
            window.top.location.href = window.top.location.href.split('#')[0].split('?')[0];
          } else {
            // Console error
            console.error(`No message received from ${id}, and user declined refresh`);
          }
        }
      }, auto_redirect_timeout ?? 10000); // allow 10s to send message after frame loads (should be overkill, but sometimes things are slow if multiple requests are running at once)
    };
    apiframe.src = `${BACKEND_URL}?id=${id}&${query}`;
    console.log(`Request ${id}: ${query}`);
  }
}

window.addEventListener('message', onMessage);

function onMessage(e) {
  auth_count = 0; // reset count if any request succeeds
  if (e.data.response) {
    console.log(`Response ${e.data.id}: ${JSON.stringify(e.data.response)}`);
    consumeCallback(e.data.id)(e.data.response);
  } else if (e.data.error) {
    console.error(`Error ${e.data.id}: ${JSON.stringify(e.data.error)}`);
    consumeCallback(e.data.id);
    alert('Error: ' + e.data.error);
  } else {
    console.warn("Invalid message: " + JSON.stringify(e.data));
  }
}

function consumeCallback(id) {
  const callback = requestCallbacks[id];
  delete requestCallbacks[id];
  const apiframe = document.getElementById(IFRAME_PREFIX + id);
  if (apiframe) apiframe.remove();
  return callback;
}