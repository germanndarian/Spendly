// Formatierung von Beträgen und Daten (reine Funktionen, ohne Intl).
// Beträge sind immer ganze Rappen (1 Franken = 100 Rappen), nie Kommazahlen.

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];
// Schweizer Kurzformen, z. B. "23. Sept."
const MONTHS_SHORT = [
  'Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni',
  'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.',
];
const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

// Fügt alle drei Ziffern (von rechts) einen Apostroph ein: "1240" -> "1'240"
function addThousandsSeparator(digits) {
  let result = '';
  for (let i = 0; i < digits.length; i++) {
    const digitsFromRight = digits.length - i;
    if (i > 0 && digitsFromRight % 3 === 0) {
      result += "'";
    }
    result += digits[i];
  }
  return result;
}

// 124050 -> "1'240.50"
export function formatAmount(rappen) {
  const sign = rappen < 0 ? '-' : '';
  const absolute = Math.abs(Math.round(rappen));
  const francs = Math.floor(absolute / 100);
  const cents = absolute % 100;
  return `${sign}${addThousandsSeparator(String(francs))}.${String(cents).padStart(2, '0')}`;
}

// 124050 -> "CHF 1'240.50"
export function formatCHF(rappen) {
  return `CHF ${formatAmount(rappen)}`;
}

// Date -> "2026-09-23" (lokale Zeit, nicht UTC – sonst springt das Datum nachts)
export function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// "2026-09-23" -> Date um Mitternacht (lokale Zeit)
export function parseISODate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Date -> "September 2026"
export function formatMonthYear(date) {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// Date -> "September"
export function formatMonthName(date) {
  return MONTHS[date.getMonth()];
}

// Date -> "23. Sept."
export function formatShortDate(date) {
  return `${date.getDate()}. ${MONTHS_SHORT[date.getMonth()]}`;
}

// Anzahl Tage zwischen zwei Daten (nur das Datum zählt, nicht die Uhrzeit)
function daysBetween(from, to) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end - start) / (24 * 60 * 60 * 1000));
}

// Überschrift im Verlauf: "Heute", "Gestern" oder "Montag, 21. Sept."
export function formatDayLabel(isoDate, today = new Date()) {
  const date = parseISODate(isoDate);
  const diff = daysBetween(date, today);
  if (diff === 0) return 'Heute';
  if (diff === 1) return 'Gestern';
  return `${WEEKDAYS[date.getDay()]}, ${formatShortDate(date)}`;
}

// Datumsfeld im Formular: "Heute, 23. Sept. 2026"
export function formatLongDate(isoDate, today = new Date()) {
  const date = parseISODate(isoDate);
  const diff = daysBetween(date, today);
  const prefix = diff === 0 ? 'Heute, ' : diff === 1 ? 'Gestern, ' : '';
  return `${prefix}${formatShortDate(date)} ${date.getFullYear()}`;
}
