function onLoad() {
  api.login((email) => alert('Logged in as ' + JSON.stringify(email)));
}


function clickButton() {
  document.getElementById('content').innerText = "Loading...";
  api.listSheets(function(sheets) {
    document.getElementById('content').innerHTML = JSON.stringify(sheets);
  });
}