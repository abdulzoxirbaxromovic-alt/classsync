# ClassSync — o‘rnatish qo‘llanmasi

ClassSync do‘stlar bilan maktabga borish kunlarini rejalashtirish uchun oddiy sayt. Saytda ism-familiya va Dushanba–Shanba kunlaridan bittasi yoki bir nechtasi tanlanadi. Javoblar Google Sheets jadvaliga yoziladi. Keyinchalik tahrirlash kodi orqali javobni yangilash mumkin.

## 1. Google Sheets jadvalini yaratish

1. [Google Sheets](https://sheets.google.com) sahifasini och.
2. Bo‘sh jadval yarat va unga masalan, `ClassSync javoblari` deb nom ber.
3. Brauzer manzilidagi `/spreadsheets/d/` va `/edit` orasidagi uzun ID qismini nusxala.

## 2. Apps Script backendni sozlash

1. Jadvalda **Extensions → Apps Script** ni och.
2. `Code.gs` ichidagi mavjud kodni o‘chirib, ushbu papkadagi `Code.gs` fayl mazmunini joylashtir.
3. Kodning yuqorisidagi `SPREADSHEET_ID` qiymatiga 1-qadamda olgan Sheet ID’ingni qo‘y.
4. Saqla (Ctrl+S yoki yuqoridagi Save belgisi).

## 3. Web App sifatida e’lon qilish

1. Apps Script oynasida **Deploy → New deployment** ni bos.
2. Tishli belgi orqali turini **Web app** qilib tanla.
3. **Execute as**: `Me`.
4. **Who has access**: `Anyone`.
5. **Deploy** ni bos va Google so‘ragan ruxsatlarni tasdiqla.
6. Chiqqan Web App URL manzilini nusxala. U odatda `https://script.google.com/macros/s/.../exec` ko‘rinishida bo‘ladi.

> Muhim: Web App manzili ommaviy bo‘ladi, chunki do‘stlaring saytdan javob yuborishi kerak. Google Sheets faylining o‘zini ommaga ochish shart emas. Jadvalni faqat o‘zingda saqla. Saytda faqat ism va rejalashtirilgan kunlarni kiriting; maxfiy yoki ortiqcha shaxsiy ma’lumot yozmang. Tahrirlash kodi shaxsiy parolga o‘xshaydi — uni boshqalarga bermang.

## 4. Saytni Google Sheets’ga ulash

1. `script.js` faylini och.
2. Yuqoridagi `API_URL` qiymatini o‘zingning Web App URL’ingga almashtir:

```js
const CONFIG = {
  API_URL: "https://script.google.com/macros/s/WEB_APP_ID/exec"
};
```

3. Faylni saqla.

## 5. GitHub Pages orqali saytni chiqarish

1. GitHub’da yangi repository yarat. Masalan, `classsync`.
2. `index.html`, `style.css`, `script.js` va `Code.gs` fayllarini repository’ning asosiy (root) qismiga yukla. `Code.gs` GitHub’da saqlanishi shart emas, lekin zaxira nusxasi sifatida qoldirishing mumkin.
3. Repository’da **Settings → Pages** bo‘limiga kir.
4. **Deploy from a branch** ni tanla.
5. Branch: `main`, folder: `/ (root)` qilib **Save** ni bos.
6. GitHub Pages sayt manzilini ko‘rsatadi. Odatda `https://USERNAME.github.io/classsync/` ko‘rinishida bo‘ladi.

## 6. Tekshirish

1. Saytni ochib ism va bir nechta kunni tanla.
2. `Rejani yuborish` tugmasini bos.
3. Birinchi yuborishda maxsus tahrirlash kodi chiqadi. Uni yozib ol.
4. Google Sheets jadvalida `ClassSync javoblari` varag‘iga yangi qator tushganini tekshir.
5. Bir kunni o‘zgartirib, `Tanlovimni yangilash` tugmasini bos. Jadvalda yangi qator qo‘shilmasdan, o‘sha qator yangilanishi kerak.

## Muhim eslatmalar

- Birinchi marta yuborgan odamning brauzerida tahrirlash kodi saqlanadi. Boshqa telefon yoki brauzerdan tahrirlash uchun ism va tahrirlash kodini kiritish kerak.
- Kod yo‘qolsa, eski javobni tahrirlashning iloji bo‘lmasligi mumkin. Kodni xavfsiz joyga yozib qo‘y.
- `Anyone` ruxsati bo‘lgan ommaviy endpointga begona odamlar ham so‘rov yuborishi mumkin. Sayt havolasini faqat o‘z guruhing bilan ulash.
- Bu loyiha do‘stlar orasidagi reja jadvali; maktabning rasmiy davomat tizimi emas. Maktab jadvali va ota-ona/o‘qituvchi ko‘rsatmalariga amal qiling.
