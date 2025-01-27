let currentUser;

function onLoad() {
  setView("ui_loading");
  api.login((email) => {
    currentUser = email;
    viewAdd();
    api.listSheets(updateSheetList);
  });
}

function sortedKeysByValue(obj) {
  let keys = Object.keys(obj);
  keys.sort((a, b) => obj[a].localeCompare(obj[b])); // assumes values are strings
  return keys;
}

function sortedKeysByKey(obj) {
  let keys = Object.keys(obj);
  keys.sort((a, b) => a.localeCompare(b)); // assumes keys are strings
  return keys;
}

function updateSheetList(sheets) {
  let new_list = "";
  for (const id of sortedKeysByValue(sheets)) {
    const q_id = quote(id);
    const name = sheets[id];
    const q_name = quote(name);
    new_list += "<li class='nav-item'><a class='nav-link btns' onclick='viewBalances(" + q_id + "," + q_name + ")'>" + sheets[id] + "</a></li>";
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
  return '"' + s.replaceAll('"','\\"').replaceAll("'","\\'") + '"';
}

// ui_balance

function viewBalances(id, name) {
  clearBalanceList("Loading...");
  api.listBalances(id, updateBalanceList);
  viewBalancesWithoutUpdatingList(id, name);
}

function viewBalancesWithoutUpdatingList(id, name) {
  document.getElementById("balance_sheet_id").value = id;
  document.getElementById("balance_google_link").href = SPREADSHEET_LINK_PREFIX + id;
  document.getElementById("balance_sheet_name").innerHTML = name;
  setView("ui_balance");
}

function clearBalanceList(placeholder) {
  document.getElementById("balance_list").innerHTML = placeholder;
}

function updateBalanceList(balances) {
  let new_list = "";
  for (const email of sortedKeysByKey(balances)) {
    const balance = balances[email];
    if (balance > 0) {
      new_list += "<li>" + email + " is <span class='owed'>owed $" + balance + "</span></li>";
    } else if (balance < 0) {
      new_list += "<li>" + email + " <span class='owes'>owes $" + (-balance) + "</span></li>";
    } else {
      new_list += "<li>" + email + " is even</li>";
    }
  }
  document.getElementById("balance_list").innerHTML = new_list;
}

// ui_add (cost)

function viewAdd(id, name) {
  if (id && name) {
    initialPopulateAddCostSheets(id, name);
  } else {
    clearAddCostSheets();
  }
  api.listSheets(updateAddCostSheets);
  const test = (new Date()).toISOString();
  var now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById("add_cost_date").value = now.toISOString().slice(0,16);
  document.getElementById("add_cost_description").value = "";
  document.getElementById("add_cost_expense").checked = true;
  setCostType(true);
  document.getElementById("add_cost_amount").value = "";
  document.getElementById("add_cost_check_all").checked = true;
  changeCostForAll();
  document.getElementById("add_cost_even").checked = true;
  setCostShares(true, false);
  setView("ui_add");
}

function initialPopulateAddCostSheets(id, name) {
  document.getElementById("add_cost_sheet").innerHTML = "<option value=" + quote(id) + ">" + name + "</option>";
  changeCostSheet();
}

function clearAddCostSheets() {
  document.getElementById("add_cost_sheet").innerHTML = "<option value=''>Loading...</option>";
  changeCostSheet();
}

function updateAddCostSheets(sheets) {
  const add_cost_sheet = document.getElementById("add_cost_sheet");
  const existing_selected_id = add_cost_sheet.value;
  let found_existing = false;
  let new_list = "";
  for (const id of sortedKeysByValue(sheets)) {
    let selected = "";
    if (id == existing_selected_id) {
      selected = " selected";
      found_existing = true;
    }
    new_list += "<option value=" + quote(id) + selected + ">" + sheets[id] + "</option>";
  }
  add_cost_sheet.innerHTML = new_list;
  if (!found_existing) {
    changeCostSheet();
  }
}

function changeCostSheet() {
  const sheet_id = document.getElementById("add_cost_sheet").value;
  if (!sheet_id) {
    clearAddCostUsers();
  } else {
    clearAddCostUsersTableOnly();
    api.listUsers(sheet_id, updateAddCostUsers);
  }
}

function clearAddCostUsers() {
  const loading_option = "<option value=''>Loading...</option>";
  document.getElementById("add_cost_paid_by").innerHTML = loading_option;
  document.getElementById("add_cost_transfer_to").innerHTML = loading_option;
  clearAddCostUsersTableOnly();
}

function clearAddCostUsersTableOnly() {
  document.getElementById("add_cost_table").innerHTML = "Loading...";
}

function updateAddCostUsers(users) {
  updateUsersForElementId("add_cost_paid_by", users, currentUser);
  updateUsersForElementId("add_cost_transfer_to", users);
  updateAddCostUsersTableOnly(users);
}

function updateUsersForElementId(element_id, users, default_select_email) {
  const element = document.getElementById(element_id);
  const existing_selected_email = element.value;
  const should_select_email = existing_selected_email && existing_selected_email.length ? existing_selected_email : default_select_email; // keep existing, or use default if no existing
  let new_list = "";
  for (const email of sortedKeysByKey(users)) {
    const selected = email == should_select_email ? " selected" : "";
    new_list += "<option value='" + email + "'" + selected + ">" + users[email] + "</option>";
  }
  element.innerHTML = new_list;
}

function updateAddCostUsersTableOnly(users) {
  const table = document.getElementById("add_cost_table");
  let new_html = "";
  const checked = true;
  for (const email of sortedKeysByKey(users)) {
    new_html += "<tr>";
    new_html += "<td>";
    new_html += "<input type='checkbox' onclick='changeCostForOne(this)' id='add_cost_for_" + email + "' class='add_cost_for'";
    if (checked) new_html += " checked";
    new_html += "> ";
    new_html += users[email];
    new_html += "</td>";
    new_html += "<td width='105px'>";
    new_html += "<div style='display: inline-block'>";
    new_html += "<input style='width: 80px' type='number' id='add_cost_share_" + email + "' class='add_cost_share' min='0'";
    if (!checked) new_html += " disabled";
    new_html += ">";
    new_html += "<span class='add_cost_percent_sign'>%</span>";
    new_html += "</div>";
    new_html += "</td>";
    new_html += "</tr>";
  }
  table.innerHTML = new_html;
  setCostShares(document.getElementById("add_cost_even").checked, document.getElementById("add_cost_by_percent").checked);
  setCostForAllState();
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

function changeCostForAll() {
  const new_value = document.getElementById("add_cost_check_all").checked;
  for (const e of document.getElementsByClassName("add_cost_for")) {
    e.checked = new_value;
    setShareInputEnabled(e);
  }
}

function changeCostForOne(e) {
  setShareInputEnabled(e);
  setCostForAllState();
}

function setCostForAllState() {
  let total = document.getElementsByClassName("add_cost_for").length;
  let checked = countForChecked();
  if (checked == total) {
    document.getElementById("add_cost_check_all").indeterminate = false;
    document.getElementById("add_cost_check_all").checked = true;
  } else if (checked == 0) {
    document.getElementById("add_cost_check_all").indeterminate = false;
    document.getElementById("add_cost_check_all").checked = false;
  } else {
    document.getElementById("add_cost_check_all").checked = false;
    document.getElementById("add_cost_check_all").indeterminate = true;
  }
}

function setShareInputEnabled(e_cost_for) {
  const number_input = document.getElementById("add_cost_share_" + getEmailFromForCheckboxId(e_cost_for.id));
  if (e_cost_for.checked) {
    number_input.disabled = false;
  } else {
    number_input.value = "";
    number_input.disabled = true;
  }
}

function getEmailFromForCheckboxId(e_cost_for_id) {
  if (!e_cost_for_id.startsWith("add_cost_for_")) {
    throw new Error("Invalid argument: " + e_cost_for_id);
  }
  return e_cost_for_id.substring("add_cost_for_".length);
}

function addCost() {
  const is_expense = document.getElementById("add_cost_expense").checked;
  const transaction = is_expense ? "expense" : "transfer";
  const sheet_select = document.getElementById("add_cost_sheet");
  const sheet_id = sheet_select.value;
  if (!sheet_id) {
    alert("Please select a Sheet to add this " + transaction + " to.");
    return;
  }
  const paid_by = document.getElementById("add_cost_paid_by").value;
  if (!paid_by) {
    if (is_expense) {
      alert("Please select who this expense was paid by.");
    } else {
      alert("Please select who this transfer is from.");
    }
    return;
  }
  const amount = parseFloat(document.getElementById("add_cost_amount").value);
  if (!(amount > 0)) {
    alert("Please enter a non-zero " + transaction + " amount.");
    return;
  }
  const date = document.getElementById("add_cost_date").value;
  const description = document.getElementById("add_cost_description").value;
  let warning = null;
  if (!date && !description) {
    warning = "Are you sure you want to leave the " + transaction + " date AND description blank?";
  } else if (!date) {
    warning = "Are you sure you want to leave the " + transaction + " date blank?";
  } else if (!description) {
    warning = "Are you sure you want to leave the " + transaction + " description blank?";
  }
  if (is_expense) {
    // expense
    let paid_for = [];
    for (const e of document.getElementsByClassName("add_cost_for")) {
      if (e.checked) {
        paid_for.push(getEmailFromForCheckboxId(e.id));
      }
    }
    if (paid_for.length == 0) {
      alert("Please select at least 1 person this expense is paying for.");
      return;
    }
    if (paid_for.length == 1 && paid_for[0] == paid_by) {
      alert("Please select more people this expense is for other than the person who paid.");
      return;
    }
    let split = [];
    const is_percent = document.getElementById("add_cost_by_percent").checked;
    if (!document.getElementById("add_cost_even").checked) {
      let sum = 0;
      for (let i = 0; i < paid_for.length; i++) {
        console.log("add_cost_share_" + paid_for[i]);
        const share = parseFloat(document.getElementById("add_cost_share_" + paid_for[i]).value);
        if (!(share > 0)) {
          alert("Please enter a non-zero share for " + paid_for[i] + ".");
          return;
        }
        split.push(share);
        sum += share;
      }
      if (is_percent && sum != 100) {
        alert("Please make the percentages add to 100%, or use shares instead.");
        return;
      }
    }
    paid_for = paid_for.join(",");
    split = split.join(is_percent ? "/" : ":");
    if (warning && !confirm(warning)) return;
    clearBalanceList("Adding expense...");
    api.addCost(sheet_id, date, description, amount, paid_by, paid_for, split, updateBalanceList)
  } else {
    // transfer
    const transfer_to = document.getElementById("add_cost_transfer_to").value;
    if (!transfer_to) {
      alert("Please select who this transfer is to.");
      return;
    }
    if (transfer_to == paid_by) {
      alert("Please select different people for 'From' and 'To'.");
      return;
    }
    if (warning && !confirm(warning)) return;
    clearBalanceList("Adding transfer...");
    api.addCost(sheet_id, date, description, amount, paid_by, transfer_to, "", updateBalanceList)
  }
  const sheet_name = getOptionText(sheet_select, sheet_id);
  viewBalancesWithoutUpdatingList(sheet_id, sheet_name);
}

function getOptionText(select_element, option_value) {
  for (var i = 0; i < select_element.length; i++) {
    const option_element = select_element[i];
    if (option_element.value == option_value) {
      return option_element.innerText;
    }
  }
  return null;
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
  for (const id of sortedKeysByValue(sheets)) {
    const q_id = quote(id);
    const name = sheets[id];
    const q_name = quote(name);
    new_list += "<tr><td>&nbsp;&nbsp;" + name + "</td><td width=90px><button class='btn btn-info btn-sm my-2 my-sm-0' onClick='editSheet(" + q_id + "," + q_name + ")'>✎</button> <button class='btn btn-danger btn-sm my-2 my-sm-0' onClick='deleteSheet(" + q_id + "," + q_name + ")'>🗑</button></td></tr>";
  }
  document.getElementById("manage_sheets").innerHTML = new_list;
  updateSheetList(sheets); // so the menu gets the updates too
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
    existing = existing.replaceAll('\\','/');
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