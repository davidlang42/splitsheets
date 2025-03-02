const SPREADSHEET_LINK_PREFIX = "https://docs.google.com/spreadsheets/d/";

// returns a Spreadsheet object, or null if it can't be accessed 
function tryOpenSheet(id) {
  try {
    var file = DriveApp.getFileById(id); // this throws an error if you can't access it, which can be caught
    return SpreadsheetApp.open(file); // SpreadsheetApp.openById crashes the whole app if you can't access it, which cannot be caught
  } catch {
    return null;
  }
}

// returns a Spreadsheet object, throws an error if it can't be accessed
function openSheet(id) {
  var sheet = tryOpenSheet(id);
  if (!sheet) throw new Error("Could not access Spreadsheet with ID: " + id);
  return sheet;
}

// returns the index of column_name in headers, throw an error if not found
function findColumn(headers, column_name) {
  var index = headers.indexOf(column_name);
  if (index == -1) throw new Error("Could not find column '" + column_name + "'");
  return index;
}

function tryOpenFile(id) {
  try {
    return DriveApp.getFileById(id); // this throws an error if you can't access it, which can be caught
  } catch {
    return null;
  }
}

// returns a File object, throws an error if it can't be accessed
function openFile(id) {
  var file = tryOpenFile(id);
  if (!file) throw new Error("Could not access Spreadsheet with ID: " + id);
  return file;
}

function userListContains(list, email) {
  for (const user of list) {
    if (user.getEmail() == email) {
      return true;
    }
  }
  return false;
}

function ensureEditAccess(sheet, sheet_name) {
  const this_user = Session.getActiveUser().getEmail();
  const owner = sheet.getOwner().getEmail();
  if (owner != this_user && !userListContains(sheet.getEditors(), this_user)) {
    sheet_name ??= "this sheet";
    throw new Error("You don't have access to edit " + sheet_name + ". Please contact " + owner + " for access.");
  }
}

function createRow(headers, date, description, amount, paid_by, paid_for, split) {
  const row = [];
  row[findColumn(headers, DATE_COLUMN)] = date;
  row[findColumn(headers, DESCRIPTION_COLUMN)] = description;
  row[findColumn(headers, AMOUNT_COLUMN)] = amount;
  row[findColumn(headers, PAID_BY_COLUMN)] = paid_by;
  row[findColumn(headers, PAID_FOR_COLUMN)] = paid_for;
  row[findColumn(headers, SPLIT_COLUMN)] = split;
  return row;
}