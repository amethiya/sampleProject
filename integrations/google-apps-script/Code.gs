/**
 * Revamp Radar → Google Sheets webhook.
 *
 * Setup (once):
 *  1. Open the "Revamp Radar Leads" Google Sheet → Extensions → Apps Script.
 *  2. Paste this file, then Project Settings → Script properties → add SHEETS_SECRET = <long random string>.
 *  3. Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone.
 *  4. Copy the /exec URL and set it on the Worker:  npx wrangler secret put SHEETS_WEBHOOK_URL
 *     and the same secret:                          npx wrangler secret put SHEETS_SECRET
 *
 * The Worker POSTs {secret, headers, rows}. Rows already present (same Website) are skipped.
 */
var SHEET_NAME = 'Leads'; // falls back to the first tab

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var body = JSON.parse(e.postData.contents);
    var secret = PropertiesService.getScriptProperties().getProperty('SHEETS_SECRET');
    if (!secret || body.secret !== secret) return out({ ok: false, error: 'bad secret' });

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(body.headers);
      sheet.getRange(1, 1, 1, body.headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var websiteCol = body.headers.indexOf('Website') + 1;
    var existing = {};
    if (sheet.getLastRow() > 1 && websiteCol > 0) {
      sheet.getRange(2, websiteCol, sheet.getLastRow() - 1, 1).getValues()
        .forEach(function (r) { existing[r[0]] = true; });
    }
    var fresh = body.rows.filter(function (r) { return !existing[r[websiteCol - 1]]; });
    if (fresh.length) {
      var range = sheet.getRange(sheet.getLastRow() + 1, 1, fresh.length, fresh[0].length);
      range.setNumberFormat('@'); // keep phone numbers and dates as plain text
      range.setValues(fresh);
    }
    return out({ ok: true, appended: fresh.length, skipped: body.rows.length - fresh.length });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
