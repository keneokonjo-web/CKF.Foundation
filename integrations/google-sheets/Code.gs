/**
 * CKF Foundation: website forms -> Google Sheet.
 *
 * HOW TO USE (full steps in SETUP.md):
 *  1. Create a Google Sheet while signed in to the Foundation's Gmail (ckfoundationglobal@gmail.com).
 *  2. In that Sheet: Extensions > Apps Script. Delete the sample code and paste this whole file.
 *  3. Change TOKEN below to a long random password (the same value goes into Vercel as SHEET_TOKEN).
 *  4. Deploy > New deployment > type "Web app" > Execute as: Me > Who has access: Anyone > Deploy. Copy the Web app URL.
 *
 * Because the script is created from inside the Sheet, it writes to that Sheet automatically.
 * It makes two tabs by itself: "Enquiries" (contact form) and "Newsletter" (pop-up sign-ups).
 */
var TOKEN = 'CHANGE-ME-to-a-long-random-string';   // must equal SHEET_TOKEN in Vercel
var NOTIFY_EMAIL = '';                              // optional: an address to email on every enquiry / sign-up

var TABS = {
  enquiry:    { name: 'Enquiries',  headers: ['Timestamp', 'Name', 'Email', 'Phone', 'I would like to', 'Message', 'Language', 'Cookie choice', 'Source page'] },
  newsletter: { name: 'Newsletter', headers: ['Timestamp', 'Name', 'Email', 'Language', 'Cookie choice', 'Source page'] }
};

function doPost(e) {
  var out = function (o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); };
  var lock = LockService.getScriptLock();
  try {
    var d = JSON.parse(e.postData.contents);
    if (!TOKEN || TOKEN.indexOf('CHANGE-ME') === 0 || d.token !== TOKEN) return out({ ok: false, error: 'forbidden' });
    lock.waitLock(20000);
    var cfg = TABS[d.type === 'newsletter' ? 'newsletter' : 'enquiry'];
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(cfg.name) || ss.insertSheet(cfg.name);
    if (sh.getLastRow() === 0) { sh.appendRow(cfg.headers); sh.setFrozenRows(1); sh.getRange(1, 1, 1, cfg.headers.length).setFontWeight('bold'); }
    var safe = function (v) { v = String(v || ''); return /^[=+\-@]/.test(v) ? "'" + v : v; }; // stops spreadsheet formula injection
    var row = d.type === 'newsletter'
      ? [new Date(), safe(d.name), safe(d.email), safe(d.lang), safe(d.consent), safe(d.page)]
      : [new Date(), safe(d.name), safe(d.email), safe(d.phone), safe(d.interests), safe(d.message), safe(d.lang), safe(d.consent), safe(d.page)];
    sh.appendRow(row);
    if (NOTIFY_EMAIL) MailApp.sendEmail(NOTIFY_EMAIL, 'CKF website: new ' + (d.type === 'newsletter' ? 'newsletter sign-up' : 'enquiry') + ' from ' + (d.name || d.email),
      'Name: ' + (d.name || '') + '\nEmail: ' + d.email + (d.type === 'newsletter' ? '' : '\nPhone: ' + (d.phone || '') + '\nInterests: ' + (d.interests || '') + '\n\n' + (d.message || '')));
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function doGet() { return ContentService.createTextOutput('CKF form endpoint is live.'); }
