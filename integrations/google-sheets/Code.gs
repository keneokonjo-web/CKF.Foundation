/**
 * CKF Foundation: website form -> Google Sheet.
 * Paste into the Sheet's Apps Script editor (Extensions > Apps Script), set TOKEN, then
 * Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone.
 */
var SHEET_ID = '1Oz-D84jN7AW_vbk3m4yHKMH5B0nFagyVaso3vKnc3G0'; // "CKF Foundation · Website submissions"
var TOKEN = 'CHANGE-ME-to-a-long-random-string';                 // must equal SHEET_TOKEN in Vercel
var NOTIFY_EMAIL = '';                                           // optional: an address to email on every submission

var HEADERS = ['Timestamp', 'Name', 'Email', 'Phone', 'I would like to', 'Message', 'Source page'];

function doPost(e) {
  var out = function (o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); };
  try {
    var d = JSON.parse(e.postData.contents);
    if (!TOKEN || d.token !== TOKEN) return out({ ok: false, error: 'forbidden' });
    var lock = LockService.getScriptLock(); lock.waitLock(20000);
    var sh = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
    var safe = function (v) { v = String(v || ''); return /^[=+\-@]/.test(v) ? "'" + v : v; }; // stop spreadsheet formula injection
    sh.appendRow([new Date(), safe(d.name), safe(d.email), safe(d.phone), safe(d.interests), safe(d.message), safe(d.page)]);
    lock.releaseLock();
    if (NOTIFY_EMAIL) MailApp.sendEmail(NOTIFY_EMAIL, 'New CKF website enquiry: ' + d.name, 'Name: ' + d.name + '\nEmail: ' + d.email + '\nPhone: ' + d.phone + '\nInterests: ' + d.interests + '\n\n' + d.message);
    return out({ ok: true });
  } catch (err) { return out({ ok: false, error: String(err) }); }
}

function doGet() { return ContentService.createTextOutput('CKF form endpoint is live.'); }
