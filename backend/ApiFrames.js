const TARGET_ORIGIN = "*"; //TODO make this splitsheets.davidlang.net

// Deployed as WebApp
function doGet(e) {
  let id = e.parameter.id;
  switch(e.parameter.r) {
    case "L": // login
      return apiFrame(id, () => login());
    case "LS": // listSheets
      return apiFrame(id, () => listSheets());
      //TODO all other functions in Requests.gs 
    default:
      //TODO auth and show redirect
      return apiFrame(id, () => {
        throw new Error("No request specified")
      });
  }
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