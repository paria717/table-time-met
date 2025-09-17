export function normalizeJalali(s: string): string {
const faDigits = '۰۱۲۳۴۵۶۷۸۹';
const arDigits = '٠١٢٣٤٥٦٧٨٩';
const enDigits = '0123456789';
const mapDigit = (ch: string) => {
const iFa = faDigits.indexOf(ch);
if (iFa >= 0) return enDigits[iFa];
const iAr = arDigits.indexOf(ch);
if (iAr >= 0) return enDigits[iAr];
return ch;
};
let out = Array.from(s ?? '').map(mapDigit).join('');
out = out.replace(/[-_.]/g, '/').trim();
const m = out.match(/^(\d{4})[\/](\d{1,2})[\/](\d{1,2})$/);
if (m) {
const y = m[1];
const mo = m[2].padStart(2, '0');
const d = m[3].padStart(2, '0');
return `${y}/${mo}/${d}`;
}
return out;
}


/** مقایسه تاریخ شمسی YYYY/MM/DD به صورت عددی yyyymmdd */
export function compareJalali(a?: string, b?: string, asc = true): number {
const toNum = (v?: string) => v ? Number(normalizeJalali(v).replace(/\D+/g, '')) : 0;
const at = toNum(a), bt = toNum(b);
return asc ? at - bt : bt - at;
}