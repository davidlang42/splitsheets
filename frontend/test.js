// Credentials
const CLIENT_ID = '337265272138-jm03o939chi4um7e2nl4r5n5u3nddcl0.apps.googleusercontent.com';
const API_KEY = 'AIzaSyC_pMGHWQQkB87lRTNOT_QhiLMBsltLCNc';

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://script.googleapis.com/$discovery/rest?version=v1';

// Authorization scopes required by the API; multiple scopes can be included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById('authorize_button').style.visibility = 'hidden';
document.getElementById('signout_button').style.visibility = 'hidden';
document.getElementById('call_button').style.visibility = 'hidden';

/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
    await gapi.client.init({ // won't work unless in a real http server, use `npx http-server` for testing
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // set later
    });
    gisInited = true;
    maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('authorize_button').style.visibility = 'visible';
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
        throw (resp);
        }
        document.getElementById('signout_button').style.visibility = 'visible';
        document.getElementById('call_button').style.visibility = 'visible';
        document.getElementById('authorize_button').innerText = 'Refresh';
    };

    tokenClient.requestAccessToken({prompt: ''});
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        document.getElementById('content').innerText = '';
        document.getElementById('authorize_button').innerText = 'Authorize';
        document.getElementById('signout_button').style.visibility = 'hidden';
        document.getElementById('call_button').style.visibility = 'hidden';
    }
}

/**
 * Load the API and make an API call.  Display the results on the screen.
 */
function callScriptFunction() {
    const scriptId = 'AKfycbyPIffSe9ItyttU9tgUi5jaAsT8Z9unOXoxsAf_TxxqO19rBVS0ZldXcu0gklnWT89VOw'; // actually deployment ID (if devMode = false)

    // Call the Apps Script API run method
    //   'scriptId' is the URL parameter that states what script to run
    //   'resource' describes the run request body (with the function name
    //              to execute)
    try {
        gapi.client.script.scripts.run({
            'scriptId': scriptId,
            'resource': {
                'function': 'listSheets',
                // "parameters": [],
                // "devMode": false // if true, scriptId is file ID, if false scriptId is deploymentId
            },
        }).then(function(resp) {
            const result = resp.result;
            if (result.error && result.error.status) {
                // The API encountered a problem before the script
                // started executing.
                document.getElementById('content').innerText = 'Error calling API:\n' + JSON.stringify(result, null, 2);
            } else if (result.error) {
                // The API executed, but the script returned an error.

                // Extract the first (and only) set of error details.
                // The values of this object are the script's 'errorMessage' and
                // 'errorType', and an array of stack trace elements.
                const error = result.error.details[0];
                let p = 'Script error message: ' + error.errorMessage;

                if (error.scriptStackTraceElements) {
                    // There may not be a stacktrace if the script didn't start
                    // executing.
                    p = p + "\n" + 'Script error stacktrace:';
                    for (let i = 0; i < error.scriptStackTraceElements.length; i++) {
                        const trace = error.scriptStackTraceElements[i];
                        p = p + "\n" + '\t' + trace.function + ':' + trace.lineNumber;
                    }
                }
                document.getElementById('content').innerText = p;
            } else {
                // The structure of the result will depend upon what the Apps
                // Script function returns. Here, the function returns an Apps
                // Script Object with String keys and values, and so the result
                // is treated as a JavaScript object (sheetSet).

                const sheetSet = result.response.result;
                if (Object.keys(sheetSet).length == 0) {
                    document.getElementById('content').innerText = 'No sheets returned!';
                } else {
                    let p = 'Sheets:';
                    Object.keys(sheetSet).forEach(function(id) {
                        p = p + "\n" +'\t' + sheetSet[id] + ' (' + id + ')';
                    });
                    document.getElementById('content').innerText = p;
                }
            }
        });
    } catch (err) {
        document.getElementById('content').innerText = err.message;
        return;
    }
}