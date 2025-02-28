function sendUserRequestEmail(requestor, action, email, sheet_id, sheet_name, owner) {
  const sheet_url = SPREADSHEET_LINK_PREFIX + sheet_id;
  const action_url = EXTERNAL_URL + "?manage=" + sheet_id + "&" + action + "=" + email;
  const to_from = action == 'add' ? 'to' : 'from';
  const access_removal = action == 'add' ? 'Access' : 'Removal';
  let body = "<p>" + requestor + " has requested you <b>" + action + "</b> " + email + " " + to_from + " the <a href='" + sheet_url + "'>" + sheet_name + "</a> SplitSheet.</p>";
  body += "<p><a href='" + action_url + "'>Click here</a> to " + action + " them " + to_from + " the sheet.</p>";
  GmailApp.sendEmail(owner, access_removal + " request for " + sheet_name, null, { htmlBody: body, name: "SplitSheets" });
}