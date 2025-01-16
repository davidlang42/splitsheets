function onLoad() {
  viewAdd();
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

// ui_balance

function viewBalances(id) {
  if (!id) return;
  //TODO clear & load ui balance
  setView("ui_balance");//TODO make ui balance in html
}

// ui_add (cost)

function viewAdd(id) {
  //TODO persist last used sheet in localStorage, and set add_cost_sheet here
  document.getElementById("add_cost_date").value = Date.now();
  document.getElementById("add_cost_description").value = "";
  document.getElementById("add_cost_expense").checked = true;
  setCostType(true);
  //TODO make add_cost_paid_by default to me
  document.getElementById("add_cost_amount").value = "";
  //TODO make add_cost_transfer_to default to first not-me person (future: persist last to)
  document.getElementById("add_cost_check_all").checked = true;
  changeCostForAll();
  document.getElementById("add_cost_even").checked = true;
  setCostShares(true, false);
  setView("ui_add");
}

const DEFAULT_TRANSFER_DESCRIPTION = "Transfer";

function setCostType(is_expense) {
  const add_cost_button = document.getElementById("add_cost_button");
  const add_cost_description = document.getElementById("add_cost_description");
  if (is_expense) {
    if (add_cost_description.value == DEFAULT_TRANSFER_DESCRIPTION) add_cost_description.value = "";
    document.getElementById("add_cost_paid_by_label").innerHTML = "Paid By";
    document.getElementById("add_cost_is_transfer").style.display = "none";
    document.getElementById("add_cost_is_expense").style.display = "inherit";
    add_cost_button.classList.remove("btn-success");
    add_cost_button.classList.add("btn-primary");
    add_cost_button.innerHTML = "Add Expense";
  } else {
    if (add_cost_description.value == "") add_cost_description.value = DEFAULT_TRANSFER_DESCRIPTION;
    document.getElementById("add_cost_paid_by_label").innerHTML = "From";
    document.getElementById("add_cost_is_transfer").style.display = "inherit";
    document.getElementById("add_cost_is_expense").style.display = "none";
    add_cost_button.classList.remove("btn-primary");
    add_cost_button.classList.add("btn-success");
    add_cost_button.innerHTML = "Add Transfer";
  }
}

function changeCostForAll() {
  //TODO
}

function setCostShares(is_even, is_percent) {
  let input_value;
  if (is_even) {
    input_value = "";
  } else if (!is_percent) {
    input_value = 1;
  } else {
    var count = countForChecked();
    if (count == 0) {
      input_value = null;
    } else {
      input_value = 100/count;
    }
  }
  const input_visibility = !is_even ? "inherit" : "hidden";
  const input_max = is_percent ? 100 : null;
  for (const e of document.getElementsByClassName("add_cost_share")) {
    if (!e.disabled) {
      e.value = input_value;
    } else {
      e.value = "";
    }
    e.style.visibility = input_visibility;
    e.max = input_max;
  }
  const percent_display = is_percent ? "inherit" : "none";
  for (const e of document.getElementsByClassName("add_cost_percent_sign")) {
    e.style.display = percent_display;
  }
}

function countForChecked() {
  let count = 0;
  for (const e of document.getElementsByClassName("add_cost_for")) {
    if (e.checked) {
      count += 1;
    }
  }
  return count;
}

function changeCostForOne() {
  //TODO
}

function addCost() {
  //TODO
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
  document.getElementById("new_sheet_create").checked = true;
  document.getElementById("new_sheet_name").value = "";
  const new_sheet_link = document.getElementById("new_sheet_link");
  new_sheet_link.disabled = true;
  new_sheet_link.value = "";
  setView("ui_new");
}

const SPREADSHEET_LINK_PREFIX = "https://docs.google.com/spreadsheets/d/";

function addNewSheet() {
  const new_name = document.getElementById("new_sheet_name").value;
  if (document.getElementById("new_sheet_create").checked) {
    // create new
    if (!new_name) {
      alert('Please enter a name for the new Google Sheet');
      return;
    }
    clearManageSheets("Creating...");
    api.createSheet(new_name, updateManageSheets);
  } else {
    // add existing
    let existing = document.getElementById("new_sheet_link").value;
    if (!existing) {
      alert('Please enter the ID or link for the existing Google Sheet');
      return;
    }
    existing = existing.replace('\\','/');
    if (existing.startsWith(SPREADSHEET_LINK_PREFIX)) {
      existing = existing.substring(SPREADSHEET_LINK_PREFIX.length);
      existing = existing.split("/")[0];
    } else if (existing.indexOf('/') >= 0 || existing.indexOf(':') >= 0) {
      alert('Google Sheets links should start with ' + SPREADSHEET_LINK_PREFIX);
      return;
    }
    clearManageSheets("Adding...");
    api.addSheet(existing, new_name, updateManageSheets);
  }
  setView("ui_manage");
}