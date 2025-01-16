function onLoad() {
  confirmLogin();
  loadSheetList();
}

function confirmLogin() {
  api.login((email) => {
    // confirm logged in as the same user as last time
  });
}

function loadSheetList() {
  api.listSheets((sheets) => {
    var new_list = "";
    for (var id in sheets) {
      new_list += "<li class='nav-item'><a class='nav-link btns' onclick=viewBalances('" + id + "')>" + sheets[id] + "</a></li>";
    }
    document.getElementById("sheet_list").innerHTML = new_list;
  });
}

function viewBalances(id) {
  if (!id) return;
  //TODO clear & load ui balance
  setView("ui_balance");
}

function viewAdd(id) {
  setView("ui_add");
}

function viewManage() {
  setView("ui_manage");
}

function setView(view_id) {
  for (var e of document.getElementsByClassName("ui-view")) {
    if (e.id == view_id) {
      e.style.display = 'inherit';
    } else {
      e.style.display = 'none';
    }
  }
  $('.navbar-collapse').collapse('hide');
}