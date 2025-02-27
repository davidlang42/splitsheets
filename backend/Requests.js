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
  const notify_emails = [];
  const my_email = Session.getActiveUser().getEmail();
  if (paid_by != my_email) notify_emails.push(paid_by);
  const paid_for_split = paid_for.split(",");
  for (const email of paid_for_split) {
    if (email != my_email && !notify_emails.includes(email)) notify_emails.push(email);
  }
  var p = PropertiesService.getUserProperties();
  var sheet_name = sheet.getName();
  let body = "<p>" + my_email + " added a $" + amount + " cost called '" + description + "' to the '" + sheet_name + "' SplitSheet.<p>";
  body += "<p>It was paid by " + paid_by + " for:</p><ul>";
  for (const email of paid_for_split) {
    body += "<li>" + email + "</li>";
  }
  body += "</ul>";
  if (split) body += "<p>Split in the ratios: " + split + "</p>";
  body += "<p>Click here to <a href='" + EXTERNAL_URL + "?id=" + sheet_id + "'>view balances</a>, or open the Google Sheet <a href='" + SPREADSHEET_LINK_PREFIX + sheet_id + "'>for details</a>.</p>";
  if (description) {
    description = "'" + description + "'";
  } else {
    description = "Cost"
  }
  for (const email of notify_emails) {
    GmailApp.sendEmail(email, description + " added to " + sheet_name, null, { htmlBody: body, name: "SplitSheets" });
  }
  return listBalances(sheet_id, sheet);
}

// return balances from a given sheet as {email: owed}
function listBalances(sheet_id, _sheet_already_open) {
  var sheet = _sheet_already_open ?? openSheet(sheet_id);
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
  return {
    last_updated: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'EEE dd MMM yyyy HH:mm:ss zzz'),
    balances: result
  };
}

// return users for a given sheet as {email: alias}
function listUsers(sheet_id) {
  var file = openFile(sheet_id);
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
