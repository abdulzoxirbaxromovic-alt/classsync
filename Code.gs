/**
 * ClassSync — Google Sheets backend
 * Paste this file into Extensions > Apps Script in your Google Sheet.
 * Set SPREADSHEET_ID before deploying the Web App.
 */
const SPREADSHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const RESPONSE_SHEET_NAME = 'ClassSync javoblari';
const ALLOWED_DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const HEADERS = ['ID', 'Yaratilgan vaqt', 'Yangilangan vaqt', 'Ism va familiya', 'Tanlangan kunlar', 'Tahrirlash kodi xeshi'];

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const result = handleRequest_(params);
  const callback = String(params.callback || '');

  // JSONP is used so the GitHub Pages site can receive a response without a server of its own.
  if (/^ClassSyncCallbacks\.cb_[A-Za-z0-9_]+$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(result) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleRequest_(params) {
  let lock;
  try {
    const action = String(params.action || '');
    const name = normalizeName_(params.name);
    const days = normalizeDays_(params.days);
    const editCode = String(params.editCode || '').trim().toUpperCase();

    if (action !== 'create' && action !== 'update') {
      throw new Error('Noto‘g‘ri so‘rov turi.');
    }
    if (name.length < 2 || name.length > 60) {
      throw new Error('Ism 2–60 ta belgidan iborat bo‘lishi kerak.');
    }
    if (days.length < 1) {
      throw new Error('Kamida bitta kun tanlanishi kerak.');
    }
    if (!/^[A-Z0-9]{8,16}$/.test(editCode)) {
      throw new Error('Tahrirlash kodi noto‘g‘ri.');
    }

    lock = LockService.getScriptLock();
    lock.waitLock(15000);

    const sheet = getResponseSheet_();
    const now = new Date();
    const codeHash = hashCode_(editCode);

    if (action === 'create') {
      const id = Utilities.getUuid();
      sheet.appendRow([
        id,
        now,
        now,
        safeCell_(name),
        days.join(', '),
        codeHash
      ]);
      return { ok: true, id: id, message: 'Reja saqlandi.' };
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) throw new Error('Hozircha tahrirlanadigan javob topilmadi.');

    const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
    const requestedId = String(params.id || '').trim();
    const matches = [];

    rows.forEach((row, index) => {
      const idMatches = requestedId ? String(row[0]) === requestedId : true;
      const nameMatches = requestedId ? true : String(row[3]) === safeCell_(name);
      const codeMatches = String(row[5]) === codeHash;
      if (idMatches && nameMatches && codeMatches) matches.push(index + 2);
    });

    if (matches.length !== 1) {
      throw new Error('Javob topilmadi. Ismingni va tahrirlash kodingni tekshir.');
    }

    const rowNumber = matches[0];
    sheet.getRange(rowNumber, 3, 1, 3).setValues([[now, safeCell_(name), days.join(', ')]]);
    return { ok: true, id: String(sheet.getRange(rowNumber, 1).getValue()), message: 'Reja yangilandi.' };

  } catch (error) {
    return { ok: false, message: error && error.message ? error.message : 'Noma’lum xatolik.' };
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function getResponseSheet_() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID === 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE') {
    throw new Error('Code.gs ichiga Google Sheets ID raqamini kiriting.');
  }

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(RESPONSE_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(RESPONSE_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.autoResizeColumns(1, HEADERS.length);
  }
  return sheet;
}

function normalizeName_(value) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
}

function normalizeDays_(value) {
  const requested = String(value || '').split(',').map(item => item.trim());
  const unique = [];
  requested.forEach(day => {
    if (ALLOWED_DAYS.indexOf(day) !== -1 && unique.indexOf(day) === -1) unique.push(day);
  });
  return ALLOWED_DAYS.filter(day => unique.indexOf(day) !== -1);
}

function safeCell_(value) {
  const text = String(value || '');
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function hashCode_(code) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    code,
    Utilities.Charset.UTF_8
  );
  return digest.map(byte => {
    const unsigned = (byte + 256) % 256;
    return ('0' + unsigned.toString(16)).slice(-2);
  }).join('');
}
