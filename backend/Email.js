function sendUserRequestEmail(requestor, action, email, sheet_id, sheet_name, owner) {
  const sheet_url = SPREADSHEET_LINK_PREFIX + sheet_id;
  const action_url = EXTERNAL_URL + "?share=" + sheet_id + "&" + action + "=" + email;
  const to_from = action == 'add' ? 'to' : 'from';
  const access_removal = action == 'add' ? 'Access' : 'Removal';
  let body = "<p>" + requestor + " has requested you <b>" + action + "</b> " + email + " " + to_from + " the <a href='" + sheet_url + "'>" + sheet_name + "</a> SplitSheet.</p>";
  body += "<p><a href='" + action_url + "'>Click here</a> to " + action + " them " + to_from + " the sheet.</p>";
  GmailApp.sendEmail(owner, access_removal + " request for " + sheet_name, null, { htmlBody: body, name: "SplitSheets" });
}

function sendUserAccessEmail(owner, action, email, sheet_id, sheet_name) {
  const sheet_url = SPREADSHEET_LINK_PREFIX + sheet_id;
  const action_url = EXTERNAL_URL + "?" + action + "=" + sheet_id;
  const to_from = action == 'add' ? 'to' : 'from';
  const granted_removed = action == 'add' ? 'granted' : 'removed';
  const added_removed = action == 'add' ? "added" : "removed";
  let body = "<p>" + owner + " has " + added_removed + " you " + to_from + " the <a href='" + sheet_url + "'>" + sheet_name + "</a> sheet.</p>";
  body += "<p><a href='" + action_url + "'>Click here</a> to " + action + " this sheet " + to_from + " the SplitSheets app.</p>";
  GmailApp.sendEmail(email, "Access " + granted_removed + " " + to_from + " " + sheet_name, null, { htmlBody: body, name: "SplitSheets" });
}

function sendAddCostEmails(sheet_id, sheet_name, description, amount, paid_by, paid_for, split, users) {
  const notify_emails = [];
  const my_email = Session.getActiveUser().getEmail();
  if (paid_by != my_email) notify_emails.push(paid_by);
  const paid_for_split = paid_for.split(",");
  for (const email of paid_for_split) {
    if (email != my_email && !notify_emails.includes(email)) notify_emails.push(email);
  }
  let body = "<p>" + (users[my_email] ?? my_email) + " added a $" + amount + " cost called '" + description + "' to the '" + sheet_name + "' SplitSheet.<p>";
  body += "<p>It was paid by " + (users[paid_by] ?? paid_by) + " for:</p><ul>";
  for (const email of paid_for_split) {
    body += "<li>" + (users[email] ?? email) + "</li>";
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
}