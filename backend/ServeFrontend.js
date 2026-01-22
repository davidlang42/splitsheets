// For instances when we want to avoid using ApiFrames (which requires third-party cookies)
// we can serve the frontend code directly:
// - index.thml (except with direct <?= include() ?> of SplitSheets.css, SplitSheets.js, ApiFrames.js)
// - SplitSheets.css (unmodified other than wrapped in <style>)
// - SplitSheets.js (unmodified other than wrapped in <script>)
// - ApiFrames.js (alternative implementation of api.* which uses direct AppsScript RPC)

function serveFrontend() {
  return HtmlService.createTemplateFromFile("Frontend-index").evaluate()
    .setTitle("SplitSheets") // also in backend/Frontend-index.html, frontend/direct.html
    .addMetaTag("viewport", "width=200, initial-scale=1") // also in backend/Frontend-index.html, frontend/direct.html
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename,objects) {
  if(objects) {
    var html = HtmlService.createTemplateFromFile(filename);
    for(var obj in objects) {
      html[obj] = objects[obj];
    }
    return html.evaluate().getContent();
  } else {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  }
}