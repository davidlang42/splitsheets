const BACKEND_URL = "https://script.google.com/macros/s/AKfycbyVEMBqoApPG_0rD9cp5nL9DhJaNiKgviIn4kA3jZI6yztz6mRWBGHFIPOxlu3xMsaK/exec";
const IFRAME_PREFIX = "apiFrame_";

let auth_count = new URLSearchParams(window.location.search).get('a') ?? 0;

const MAX_LOGIN_SECONDS = 1; // we want to redirect quickly on page load if not logged in
const MAX_REQUEST_SECONDS = 10; // should be overkill, but sometimes things are slow if multiple requests are running at once

let api = {
  login: (callback) => sendRequest('login', [], callback, 'login', MAX_LOGIN_SECONDS * 1000), // returns the email of the current user
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
};

const requestCallbacks = {}; // {id: callback}
const requestTimeouts = {}; // {id: count}

function sendRequest(request, parameters, callback, cache_id, auto_redirect_timeout) {
  if (cache_id && callback) {
    const cached_response = window.localStorage.getItem(cache_id);
    if (cached_response) {
      console.log(`Cached ${cache_id}: ${cached_response}`);
      callback(JSON.parse(cached_response));
    }
    const original_callback = callback;
    callback = function(r) {
      const new_response = jsonStringifyInOrder(r);
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
      const r_cloned = { ...r }; // in case a callback mutates its response
      existing_callback(r_cloned);
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
    registerTimeout(id);
    apiframe.onload = function() {
      window.setTimeout(function() {
        if (deregisterTimeout(id)) {
          // This was the last timeout, so we should now check if any message has been received
          if (consumeCallback(id)) {
            // No message was received
            if (auto_redirect_timeout) {
              // Redirect to login
              window.top.location.href = BACKEND_URL + "?a=" + auth_count;
            } else if (confirm(`The server has not responded to the '${request}' request for ${MAX_REQUEST_SECONDS}s, would you like to reload the page?`)) {
              // Reload the client
              window.top.location.href = window.top.location.href.split('#')[0].split('?')[0];
            } else {
              // Console error
              console.error(`No message received from ${id}, and user declined refresh`);
            }
          }
        }
      }, auto_redirect_timeout ?? MAX_REQUEST_SECONDS * 1000); // allow time to send message after frame loads
    };
    apiframe.src = `${BACKEND_URL}?id=${id}&${query}`;
    console.log(`Request ${id}: ${query}`);
  }
}

window.addEventListener('message', onMessage);

function onMessage(e) {
  const id = e.data.id;
  if (!id) {
    console.warn("Non-apiFrame message: " + JSON.stringify(e.data));
    return;
  }
  const callback = consumeCallback(id);
  if (!callback) {
    console.error("Message for id '" + id + "' had no callback");
    return;
  }
  auth_count = 0; // reset count if any request succeeds (even if the response is an error)
  if (e.data.response) {
    console.log(`Response ${id}: ${JSON.stringify(e.data.response)}`);
    callback(e.data.response);
  } else if (e.data.error) {
    console.error(`Error ${id}: ${JSON.stringify(e.data.error)}`);
    alert('Error: ' + e.data.error);
  } else {
    console.error("Invalid apiFrame message: " + JSON.stringify(e.data));
  }
}

function consumeCallback(id) {
  const callback = requestCallbacks[id];
  delete requestCallbacks[id];
  const apiframe = document.getElementById(IFRAME_PREFIX + id);
  if (apiframe) apiframe.remove();
  return callback;
}

function registerTimeout(id) {
  const count = requestTimeouts[id] ?? 0;
  requestTimeouts[id] = count + 1;
}

function deregisterTimeout(id) {
  let count = requestTimeouts[id];
  if (!count) {
    throw new Error("Tried to deregister non-existent timeout for id: " + id);
  }
  if (count == 1) {
    delete requestTimeouts[id];
    return true; // this was the last timeout
  } else {
    requestTimeouts[id] = count - 1;
    return false; // more timeouts remain
  }
}

function jsonStringifyInOrder(obj) {
  // https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify
  const all_keys = new Set();
  JSON.stringify(obj, (k, v) => (all_keys.add(k), v)); // populate all_keys with the keys of all nested objects
  const sorted_keys = Array.from(all_keys).sort(); // sort them all into one big long order
  return JSON.stringify(obj, sorted_keys); // stringify with keys in that order
}