const EXTERNAL_URL = "https://splitsheets.davidlang.net"
const TARGET_ORIGIN = EXTERNAL_URL; // needs to be "*" to test locally

// Deployed as WebApp
function doGet(e) {
  if (!e.parameter.r) {
    // auth & redirect
    return redirect(EXTERNAL_URL);
  } else {
    // apiFrame request
    let id = e.parameter.id;
    let p = e.parameters.p;
    switch(e.parameter.r) {
      case "login":
        return apiFrame(id, () => login());
      case "listSheets":
        return apiFrame(id, () => listSheets());
      case "addSheet":
        return apiFrame(id, () => addSheet(p[0], p[1]));
      case "removeSheet":
        return apiFrame(id, () => removeSheet(p[0]));
      case "createSheet":
        return apiFrame(id, () => createSheet(p[0]));
      case "addCost":
        return apiFrame(id, () => addCost(p[0], p[1], p[2], p[3], p[4], p[5], p[6]));
      case "listBalances":
        return apiFrame(id, () => listBalances(p[0]));
      case "listUsers":
        return apiFrame(id, () => listUsers(p[0]));
      default:
        return apiFrame(id, () => {
          throw new Error("Invalid request: " + e.parameter.r)
        });
    }
  }
}

function redirect(url) {
  var html = "<h2 style='font-family: sans-serif;'><a href='" + url + "' target='_top'>Login successul, click here to launch SplitSheets</a></h2><script>window.open('"+url+"','_top');</script>";
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function apiFrame(id, lambda) {
  // the actual html returned from Google Apps Scripts gets sandboxed inside another 2 layers of iframes:
  // apiFrame (Frontend)
  //  > sandboxFrame (GAS)
  //     > userHtmlFrame (GAS)
  //        > this code (Backend)
  // as such, we can either use window.top, or the exact number of parents, but Safari has security issues with window.top
  let html = "<script>window.parent.parent.parent.postMessage({";
  if (id) {
    html += "id:'" + id.replaceAll("'", "\\'") + "',";
  }
  try {
    const response = lambda();
    html += "response:JSON.parse('" + JSON.stringify(response).replaceAll("'","\\'").replaceAll('\"','\\"') + "')";
  } catch (error) {
    html += "error:'" + error.message.replaceAll("'", "\\'") + "'";
  }
  html += "},'" + TARGET_ORIGIN + "');</script>";
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}