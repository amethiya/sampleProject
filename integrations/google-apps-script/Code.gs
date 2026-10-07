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
 * The Worker POSTs {secret, headers, rows}. Each row is matched by its Website value:
 * a new website is appended; a known one has its Revamp Radar columns updated in place (status, contacts,
 * preview link…). Columns to the right of the Revamp Radar columns are never touched, so your own notes stay.
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
    var width = body.headers.length;
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(body.headers);
      sheet.getRange(1, 1, 1, width).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var websiteCol = body.headers.indexOf('Website');
    var rowOf = {};
    if (sheet.getLastRow() > 1 && websiteCol >= 0) {
      sheet.getRange(2, websiteCol + 1, sheet.getLastRow() - 1, 1).getValues()
        .forEach(function (r, i) { if (r[0]) rowOf[r[0]] = i + 2; });
    }

    var updated = 0, appended = [];
    body.rows.forEach(function (r) {
      var at = rowOf[r[websiteCol]];
      if (at) {
        var range = sheet.getRange(at, 1, 1, width);
        range.setNumberFormat('@');
        range.setValues([r]);
        updated++;
      } else {
        appended.push(r);
      }
    });
    if (appended.length) {
      var range = sheet.getRange(sheet.getLastRow() + 1, 1, appended.length, width);
      range.setNumberFormat('@'); // keep phone numbers and dates as plain text
      range.setValues(appended);
    }
    return out({ ok: true, appended: appended.length, updated: updated });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
