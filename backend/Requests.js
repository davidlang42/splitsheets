// returns the email of the current user
function login() {
  return Session.getActiveUser().getEmail();
}

// returns known sheets as {id: name}
function listSheets() {
  var p = PropertiesService.getUserProperties();
  return p.getProperties();
}

// adds or renames a sheet to the list of known sheets, if no name is provided it will open the spreadsheet and get its actual name, then returns the updated list of sheets
function addSheet(sheet_id, name) {
  if (!name) {
    var sheet = openSheet(sheet_id);
    name = sheet.getName();
  }
  var p = PropertiesService.getUserProperties();
  p.setProperty(sheet_id, name);
  return listSheets();
}

// removes a sheet from the list of known sheets, and returns the updated list of sheets
function removeSheet(sheet_id) {
  var p = PropertiesService.getUserProperties();
  p.deleteProperty(sheet_id);
  return listSheets();
}

// creates a new sheet from the template, adds it to the list of known sheets, and returns the updated list of sheets
function createSheet(name) {
  var template = DriveApp.getFileById(TEMPLATE_ID);
  var user_root = DriveApp.getRootFolder();
  var sheet = template.makeCopy(name, user_root);
  var sheet_id = sheet.getId();
  addSheet(sheet_id, name);
  return listSheets();
}

// append a new cost row to the given sheet, then return the balances as {alias: owed}
function addCost(sheet_id, date, description, amount, paid_by, paid_for, split) {
  var sheet = openSheet(sheet_id);
  var costs = sheet.getSheetByName(COSTS_SHEET);
  if (!costs) throw new Error("Spreadsheet does not contain a sheet called '" + COSTS_SHEET + "'");
  var headers = costs.getSheetValues(1,1,1,-1)[0];
  if (!headers) throw new Error(COSTS_SHEET + " does not contain a header row");
  var row = [];
  row[findColumn(headers, DATE_COLUMN)] = date;
  row[findColumn(headers, DESCRIPTION_COLUMN)] = description;
  row[findColumn(headers, AMOUNT_COLUMN)] = amount;
  row[findColumn(headers, PAID_BY_COLUMN)] = paid_by;
  row[findColumn(headers, PAID_FOR_COLUMN)] = paid_for;
  row[findColumn(headers, SPLIT_COLUMN)] = split;
  costs.appendRow(row);
  sendAddCostEmails(sheet_id, sheet.getName(), description, amount, paid_by, paid_for, split, listUsers(sheet_id));
  return listBalances(sheet_id, sheet);
}

// return balances from a given sheet as {alias: owed}
function listBalances(sheet_id, _sheet_already_open) {
  var sheet = _sheet_already_open ?? openSheet(sheet_id);
  var balances = sheet.getSheetByName(BALANCES_SHEET);
  var values = balances.getDataRange().getValues();
  var headers = values[0];
  if (!headers) throw new Error(BALANCES_SHEET + " does not contain a header row");
  var c_person = findColumn(headers, PERSON_COLUMN);
  var c_owed = findColumn(headers, OWED_COLUMN);
  var users = listUsers(sheet_id);
  var result = {};
  for (var i = 1; i < values.length; i++) {
    const row = values[i];
    const email = row[c_person];
    if (email) {
      const alias = users[email];
      if (alias) {
        result[alias] = row[c_owed];
      } else {
        result[email] = row[c_owed];
      }
    }
  }
  return {
    last_updated: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'EEE dd MMM yyyy HH:mm:ss zzz'),
    balances: result
  };
}

// return users for a given sheet as {email: alias}
function listUsers(sheet_id, _file_already_open) {
  var file = _file_already_open ?? openFile(sheet_id);
  var users = {};
  const owner = file.getOwner();
  const email = owner.getEmail();
  users[email] = owner.getName() ?? email.split("@")[0];
  for (const editor of file.getEditors()) {
    const email = editor.getEmail();
    users[email] = editor.getName() ?? email.split("@")[0];
  }
  for (const viewer of file.getViewers()) {
    const email = viewer.getEmail();
    users[email] = viewer.getName() ?? email.split("@")[0];
  }
  return users;
}

// add a user to the given sheet, then return users as {email: alias}
function addUser(sheet_id, email) {
  //TODO this request fails with "Invalid Email: DriveUser"
  var file = openFile(sheet_id);
  //TODO need to confirm if user is already an editor of this sheet
  const this_user = Session.getActiveUser().getEmail();
  const owner = file.getOwner().getEmail();
  if (owner != this_user) {
    sendUserRequestEmail(this_user, 'add', email, sheet_id, file.getName(), owner);
    throw new Error("You must be the owner to add a user to this sheet. An email has been sent to " + owner + " requesting them to add this user.");
  }
  file.addEditor(email);
  //TODO send email with link to add sheet
  return listUsers(sheet_id, file);
}

// remove a user from the given sheet, then return users as {email: alias}
function removeUser(sheet_id, email) {
  //TODO this request fails with "Invalid Email: DriveUser"
  var file = openFile(sheet_id);
  //TODO need to check if this user is an existing editor/viewer of this sheet (also block if owner)
  const this_user = Session.getActiveUser().getEmail();
  const owner = file.getOwner().getEmail();
  if (owner != this_user) {
    sendUserRequestEmail(this_user, 'remove', email, sheet_id, file.getName(), owner);
    throw new Error("You must be the owner to remove a user from this sheet. An email has been sent to " + owner + " requesting them to remove this user.");
  }
  file.removeEditor(email);
  //TODO send an email saying youve been removed with link to remove the sheet from your list
  return listUsers(sheet_id, file);
}