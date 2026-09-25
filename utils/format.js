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
  // Ziffer für Ziffer von links nach rechts durchgehen
  for (let i = 0; i < digits.length; i++) {
    // Wie viele Ziffern stehen ab hier noch bis zum Ende?
    const digitsFromRight = digits.length - i;
    // Vor jeder Dreiergruppe (aber nicht ganz vorne) kommt ein Apostroph
    if (i > 0 && digitsFromRight % 3 === 0) {
      result += "'";
    }
    result += digits[i];
  }
  return result;
}

// 124050 -> "1'240.50"
export function formatAmount(rappen) {
  // Vorzeichen merken und danach nur mit dem positiven Betrag rechnen
  const sign = rappen < 0 ? '-' : '';
  const absolute = Math.abs(Math.round(rappen));
  // Ganze Franken (124050 -> 1240) und der Rest in Rappen (-> 50)
  const francs = Math.floor(absolute / 100);
  const cents = absolute % 100;
  // padStart(2, '0') macht aus 5 Rappen «05»
  return `${sign}${addThousandsSeparator(String(francs))}.${String(cents).padStart(2, '0')}`;
}

// 124050 -> "CHF 1'240.50"
export function formatCHF(rappen) {
  return `CHF ${formatAmount(rappen)}`;
}

// Date -> "2026-09-23" (lokale Zeit, nicht UTC – sonst springt das Datum nachts)
export function toISODate(date) {
  const year = date.getFullYear();
  // getMonth() zählt ab 0 (Januar = 0), darum + 1.
  // padStart ergänzt eine führende Null: 9 -> «09»
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// "2026-09-23" -> Date um Mitternacht (lokale Zeit)
export function parseISODate(isoDate) {
  // '2026-09-23' in die drei Zahlen 2026, 9 und 23 zerlegen
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

// Date -> "07:32" (24-Stunden-Format)
export function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Anzahl Tage zwischen zwei Daten (nur das Datum zählt, nicht die Uhrzeit)
function daysBetween(from, to) {
  // Uhrzeit weglassen, sonst wäre 23:59 bis 00:01 kein ganzer Tag
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  // Differenz in Millisekunden ÷ Millisekunden pro Tag. Math.round gleicht
  // die Zeitumstellung aus (ein Tag hat dann 23 oder 25 Stunden).
  return Math.round((end - start) / (24 * 60 * 60 * 1000));
}

// Überschrift im Verlauf: "Heute", "Gestern" oder "Montag, 21. Sept."
export function formatDayLabel(isoDate, today = new Date()) {
  const date = parseISODate(isoDate);
  // 0 = heute, 1 = gestern, 2 = vorgestern …
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

// "12,50" oder "12.50" -> 1250 Rappen. Ungültige Eingaben ergeben null.
// Das Komma ist erlaubt, weil viele Tastaturen es als Standard anbieten.
export function parseAmountToRappen(text) {
  // Komma durch Punkt ersetzen: '12,50' -> '12.50'
  const normalized = String(text).trim().replace(',', '.');
  // Erlaubt sind nur Ziffern mit höchstens einem Punkt. Die Regel (Regex)
  // lehnt z. B. '1.2.3', '-5' oder '1e3' ab.
  if (normalized === '' || normalized === '.' || !/^\d*\.?\d*$/.test(normalized)) {
    return null;
  }
  const francs = Number(normalized);
  if (!Number.isFinite(francs)) {
    return null;
  }
  // Math.round, weil z. B. 0.29 * 100 in JavaScript 28.999… ergibt
  return Math.round(francs * 100);
}

// Anzahl Nachkommastellen einer Eingabe ("12.5" -> 1)
export function countDecimals(text) {
  const normalized = String(text).trim().replace(',', '.');
  // Position des Punkts. -1 heisst: kein Punkt, also keine Nachkommastellen.
  const separator = normalized.indexOf('.');
  return separator === -1 ? 0 : normalized.length - separator - 1;
}
