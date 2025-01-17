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

// append a new cost row to the given sheet, then return the balances as {email: owed}
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
  return listBalances(sheet_id); //TODO could avoid calling openSheet() again, but check its actually slow first
}

// return balances from a given sheet as {email: owed}
function listBalances(sheet_id) {
  var sheet = openSheet(sheet_id);
  var balances = sheet.getSheetByName(BALANCES_SHEET);
  var values = balances.getDataRange().getValues();
  var headers = values[0];
  if (!headers) throw new Error(BALANCES_SHEET + " does not contain a header row");
  var c_person = findColumn(headers, PERSON_COLUMN);
  var c_owed = findColumn(headers, OWED_COLUMN);
  var result = {};
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var email = row[c_person];
    if (email) {
      result[email] = row[c_owed];
    }
  }
  return result;
}

// return users for a given sheet as {email: alias}
function listUsers(sheet_id) {
  //TODO this could either be users the sheet is shared with, or users already listed in the sheet, or maybe both
  var simple = ["test1@example.com", "test2@example.com", "davidlang42@gmail.com", sheet_id + "@sheet.id"];
  var obj = {};
  for (var i = 0; i < simple.length; i++) {
    obj[simple[i]] = simple[i].split('@')[0];
  }
  return obj;
}

//TODO share/unshare existing (owned?) sheet with another user
//TODO list/edit/delete existing costs on known sheet
