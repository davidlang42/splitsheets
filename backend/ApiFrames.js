const TARGET_ORIGIN = "*"; //TODO make this splitsheets.davidlang.net
const EXTERNAL_URL = "http://localhost:8080" //TODO

// Deployed as WebApp
function doGet(e) {
  if (!e.parameter.r) {
    // auth & redirect
    return redirect(EXTERNAL_URL);
  } else {
    // apiFrame request
    let id = e.parameter.id;
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
  let html = "<script>window.top.postMessage({";
  if (id) {
    html += "id:'" + id + "',"; //TODO escape id for safety
  }
  try {
    const response = lambda();
    html += "response:JSON.parse('" + JSON.stringify(response) + "')"; //TODO confirm this safely escapes any response
  } catch (error) {
    html += "error:'" + error.message + "'";
  }
  html += "},'" + TARGET_ORIGIN + "');</script>";
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}