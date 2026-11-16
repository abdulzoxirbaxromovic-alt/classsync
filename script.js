/* ClassSync frontend
 * 1) Deploy Code.gs as a Google Apps Script Web App.
 * 2) Paste the Web App URL into API_URL below.
 */
const CONFIG = {
  API_URL: "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE"
};

const form = document.getElementById('plannerForm');
const nameInput = document.getElementById('studentName');
const editCodeInput = document.getElementById('editCode');
const submitButton = document.getElementById('submitButton');
const submitLabel = document.getElementById('submitLabel');
const statusMessage = document.getElementById('statusMessage');
const selectionCount = document.getElementById('selectionCount');
const codeResult = document.getElementById('codeResult');
const generatedCode = document.getElementById('generatedCode');
const copyCodeButton = document.getElementById('copyCodeButton');
const newEntryButton = document.getElementById('newEntryButton');
const dayInputs = Array.from(document.querySelectorAll('input[name="days"]'));
const STORAGE_KEY = 'classsync_saved_member_v1';
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

let savedMember = loadSavedMember();

function loadSavedMember() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return value && typeof value === 'object' ? value : null;
  } catch (_) {
    return null;
  }
}

function selectedDays() {
  return dayInputs.filter(input => input.checked).map(input => input.value);
}

function updateSelectionCount() {
  const count = selectedDays().length;
  if (count === 0) selectionCount.textContent = 'Hozircha kun tanlanmagan';
  else selectionCount.textContent = `${count} ta kun tanlandi`;
}

function updateButtonLabel() {
  submitLabel.textContent = editCodeInput.value.trim() ? 'Tanlovimni yangilash' : 'Rejani yuborish';
}

function showStatus(message, type = '') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message${type ? ` ${type}` : ''}`;
}

function generateEditCode() {
  const bytes = new Uint8Array(10);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, byte => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
}

function apiConfigured() {
  return CONFIG.API_URL && CONFIG.API_URL.startsWith('https://script.google.com/macros/s/');
}

function sendJsonp(params) {
  return new Promise((resolve, reject) => {
    const callbackName = `cb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const script = document.createElement('script');
    let finished = false;
    const timeout = window.setTimeout(() => finish(new Error('Server javob bermadi. Internetni tekshirib, qayta urinib ko‘r.')), 20000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window.ClassSyncCallbacks[callbackName];
      script.remove();
    }

    function finish(error, result) {
      if (finished) return;
      finished = true;
      cleanup();
      if (error) reject(error);
      else resolve(result);
    }

    window.ClassSyncCallbacks = window.ClassSyncCallbacks || {};
    window.ClassSyncCallbacks[callbackName] = result => finish(null, result);
    script.onerror = () => finish(new Error('Google Sheets serveriga ulanib bo‘lmadi. Havolani tekshir.'));

    const query = new URLSearchParams({ ...params, callback: `ClassSyncCallbacks.${callbackName}` });
    script.src = `${CONFIG.API_URL}?${query.toString()}`;
    document.head.appendChild(script);
  });
}

function saveMember(member) {
  savedMember = member;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
  } catch (_) {
    // The edit code is also shown on screen so it can be saved manually.
  }
}

function showEditCode(code) {
  generatedCode.textContent = code;
  codeResult.hidden = false;
}

function hideEditCode() {
  codeResult.hidden = true;
}

function restoreSavedMember() {
  if (!savedMember || !savedMember.name || !savedMember.editCode) return;
  nameInput.value = savedMember.name;
  editCodeInput.value = savedMember.editCode;
  if (Array.isArray(savedMember.days)) {
    dayInputs.forEach(input => { input.checked = savedMember.days.includes(input.value); });
  }
  newEntryButton.hidden = false;
  updateSelectionCount();
  updateButtonLabel();
  showStatus('Oldingi rejang shu qurilmada topildi. Kunlarni o‘zgartirib yangilashing mumkin.');
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  hideEditCode();

  const name = nameInput.value.trim().replace(/\s+/g, ' ');
  const days = selectedDays();
  const enteredCode = editCodeInput.value.trim().toUpperCase();
  const isUpdate = enteredCode.length > 0;

  if (name.length < 2) {
    showStatus('Iltimos, ism va familiyangni yoz.', 'error');
    nameInput.focus();
    return;
  }
  if (days.length === 0) {
    showStatus('Kamida bitta kunni tanla.', 'error');
    document.getElementById('daysGrid').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (isUpdate && !/^[A-Z0-9]{8,16}$/.test(enteredCode)) {
    showStatus('Tahrirlash kodi 8–16 ta harf yoki raqamdan iborat bo‘lishi kerak.', 'error');
    editCodeInput.focus();
    return;
  }
  if (!apiConfigured()) {
    showStatus('Google Sheets hali ulanmagan. README_UZ faylidagi 2–4-qadamlarni bajarib, script.js ichiga Web App havolasini qo‘y.', 'error');
    return;
  }

  submitButton.disabled = true;
  submitLabel.textContent = isUpdate ? 'Reja yangilanmoqda...' : 'Reja yuborilmoqda...';
  showStatus('Google Sheets bilan bog‘lanilmoqda...');

  const editCode = isUpdate ? enteredCode : generateEditCode();
  const params = {
    action: isUpdate ? 'update' : 'create',
    name,
    days: days.join(','),
    editCode
  };
  if (isUpdate && savedMember && savedMember.editCode === enteredCode && savedMember.id) {
    params.id = savedMember.id;
  }

  try {
    const result = await sendJsonp(params);
    if (!result || !result.ok) throw new Error((result && result.message) || 'Saqlash amalga oshmadi.');

    saveMember({ id: result.id || (savedMember && savedMember.id) || '', name, days, editCode });
    editCodeInput.value = editCode;
    newEntryButton.hidden = false;
    updateButtonLabel();

    if (isUpdate) {
      showStatus('Rejang muvaffaqiyatli yangilandi. Google Sheets ham yangilandi.', 'success');
      showEditCode(editCode);
    } else {
      showStatus('Rejang Google Sheets jadvaliga qo‘shildi.', 'success');
      showEditCode(editCode);
    }
  } catch (error) {
    showStatus(error.message || 'Xatolik yuz berdi. Qayta urinib ko‘r.', 'error');
  } finally {
    submitButton.disabled = false;
    updateButtonLabel();
  }
});

dayInputs.forEach(input => input.addEventListener('change', updateSelectionCount));
editCodeInput.addEventListener('input', updateButtonLabel);

newEntryButton.addEventListener('click', () => {
  savedMember = null;
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* ignore */ }
  form.reset();
  editCodeInput.value = '';
  newEntryButton.hidden = true;
  hideEditCode();
  showStatus('Yangi javob kiritishing mumkin.');
  updateSelectionCount();
  updateButtonLabel();
  nameInput.focus();
});

copyCodeButton.addEventListener('click', async () => {
  const code = generatedCode.textContent;
  try {
    await navigator.clipboard.writeText(code);
    copyCodeButton.textContent = 'Nusxalandi ✓';
  } catch (_) {
    copyCodeButton.textContent = 'Kodni qo‘lda saqla';
  }
  window.setTimeout(() => { copyCodeButton.textContent = 'Nusxalash'; }, 2200);
});

restoreSavedMember();
updateSelectionCount();
updateButtonLabel();
