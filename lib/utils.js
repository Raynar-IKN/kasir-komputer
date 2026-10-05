export const rp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

const JAKARTA_TIME_ZONE = 'Asia/Jakarta';

export function todayLocal() {
  return new Date().toLocaleDateString('en-CA', { timeZone: JAKARTA_TIME_ZONE });
}

export function firstDayOfMonthLocal() {
  return `${todayLocal().slice(0, 7)}-01`;
}

export function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function normalizePhone(value) {
  if (typeof value !== 'string') return null;
  let phone = value.replace(/\D/g, '');
  if (phone.startsWith('62')) phone = '0' + phone.slice(2);
  return /^08\d{8,12}$/.test(phone) ? phone : null;
}