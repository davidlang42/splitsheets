function onLoad() {
  setView("ui_add");
  api.listSheets(updateSheetList);
}

function updateSheetList(sheets) {
  let new_list = "";
  //TODO sort in name order
  for (const id in sheets) {
    new_list += "<li class='nav-item'><a class='nav-link btns' onclick=viewBalances('" + id + "')>" + sheets[id] + "</a></li>";
  }
  document.getElementById("sheet_list").innerHTML = new_list;
}

function setView(view_id) {
  for (const e of document.getElementsByClassName("ui-view")) {
    if (e.id == view_id) {
      e.style.display = 'inherit';
    } else {
      e.style.display = 'none';
    }
  }
  $('.navbar-collapse').collapse('hide');
}

function quote(s) {
  return '"' + s.replace('"','\\"') + '"';
}

// ui_balances

function viewBalances(id) {
  if (!id) return;
  //TODO clear & load ui balance
  setView("ui_balance");
}

// ui_add (cost)

function viewAdd(id) {
  setView("ui_add");
}

// ui_manage (sheets)

function viewManage() {
  clearManageSheets("Loading...");
  api.listSheets(updateManageSheets);
  setView("ui_manage");
}

function clearManageSheets(placeholder) {
  document.getElementById("manage_sheets").innerHTML = "&nbsp;&nbsp;" + placeholder;
}

function updateManageSheets(sheets) {
  let new_list = "";
  //TODO sort in name order
  for (const id in sheets) {
    const q_id = quote(id);
    const name = sheets[id];
    const q_name = quote(name);
    new_list += "<tr><td>&nbsp;&nbsp;" + name + "</td><td width=90px><button class='btn btn-info btn-sm my-2 my-sm-0' onClick='editSheet(" + q_id + "," + q_name + ")'>✎</button> <button class='btn btn-danger btn-sm my-2 my-sm-0' onClick='deleteSheet(" + q_id + "," + q_name + ")'>🗑</button></td></tr>";
  }
  document.getElementById("manage_sheets").innerHTML = new_list;
}

function editSheet(id, name) {
  let msg = "What should '" + name + "' be renamed to?";
  msg += "\n(This won't rename the underlying Google Sheet, or change its name for other users)";
  let new_name = prompt(msg, name);
  if (new_name || new_name == "") { // empty string means get the name from the actual sheet
    clearManageSheets("Renaming...");
    api.addSheet(id, new_name, updateManageSheets);
  }
}

function deleteSheet(id, name) {
  let msg = "Are you sure you want to remove '" + name + "' from SplitSheets?";
  msg += "\n(This won't delete the underlying Google Sheet, or remove it for other users)";
  if (confirm(msg)) {
    clearManageSheets("Deleting...");
    api.removeSheet(id, updateManageSheets);
  }
}

// ui_new (sheet)

function viewNew() {
  setView("ui_new");
}