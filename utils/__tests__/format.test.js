// Unit-Tests für utils/format.js
// Fixe Daten statt "heute", damit die Tests an jedem Tag gleich laufen.
import {
  countDecimals,
  formatAmount,
  formatCHF,
  formatDayLabel,
  formatLongDate,
  formatMonthName,
  formatMonthYear,
  formatShortDate,
  formatTime,
  parseAmountToRappen,
  parseISODate,
  toISODate,
} from '../format';

// 23. September 2026 (Monate zählen in JavaScript ab 0)
const TODAY = new Date(2026, 8, 23);

describe('formatAmount / formatCHF', () => {
  test('formatiert Rappen mit zwei Nachkommastellen', () => {
    expect(formatAmount(2450)).toBe('24.50');
    expect(formatAmount(5)).toBe('0.05');
    expect(formatAmount(0)).toBe('0.00');
  });

  test("setzt den Schweizer Apostroph als Tausendertrennzeichen", () => {
    expect(formatAmount(124050)).toBe("1'240.50");
    expect(formatAmount(100000000)).toBe("1'000'000.00");
    expect(formatAmount(99999)).toBe('999.99');
  });

  test('zeigt negative Beträge mit Minus', () => {
    expect(formatAmount(-1250)).toBe('-12.50');
  });

  test('formatCHF stellt "CHF" voran', () => {
    expect(formatCHF(80000)).toBe('CHF 800.00');
    expect(formatCHF(124050)).toBe("CHF 1'240.50");
  });
});

describe('parseAmountToRappen', () => {
  test('akzeptiert Punkt und Komma', () => {
    expect(parseAmountToRappen('12.50')).toBe(1250);
    expect(parseAmountToRappen('12,50')).toBe(1250);
  });

  test('akzeptiert ganze Zahlen und eine Nachkommastelle', () => {
    expect(parseAmountToRappen('800')).toBe(80000);
    expect(parseAmountToRappen('6.8')).toBe(680);
    expect(parseAmountToRappen('.5')).toBe(50);
  });

  test('rechnet ohne Rundungsfehler von Kommazahlen', () => {
    // 0.29 * 100 ergibt in JavaScript 28.999999999999996
    expect(parseAmountToRappen('0.29')).toBe(29);
    expect(parseAmountToRappen('19.99')).toBe(1999);
  });

  test('gibt null zurück bei ungültigen Eingaben', () => {
    expect(parseAmountToRappen('')).toBeNull();
    expect(parseAmountToRappen('.')).toBeNull();
    expect(parseAmountToRappen('abc')).toBeNull();
    expect(parseAmountToRappen('1.2.3')).toBeNull();
    expect(parseAmountToRappen('-5')).toBeNull();
    expect(parseAmountToRappen('1e3')).toBeNull();
  });
});

describe('countDecimals', () => {
  test('zählt die Stellen nach Punkt oder Komma', () => {
    expect(countDecimals('12')).toBe(0);
    expect(countDecimals('12.5')).toBe(1);
    expect(countDecimals('12,50')).toBe(2);
    expect(countDecimals('12.505')).toBe(3);
  });
});

describe('Datum', () => {
  test('toISODate und parseISODate sind Gegenstücke', () => {
    expect(toISODate(TODAY)).toBe('2026-09-23');
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toISODate(parseISODate('2026-02-28'))).toBe('2026-02-28');
  });

  test('Monatsnamen und Kurzformen auf Deutsch (Schweiz)', () => {
    expect(formatMonthYear(TODAY)).toBe('September 2026');
    expect(formatMonthName(new Date(2026, 2, 1))).toBe('März');
    expect(formatShortDate(TODAY)).toBe('23. Sept.');
  });

  test('formatDayLabel: Heute, Gestern, sonst Wochentag', () => {
    expect(formatDayLabel('2026-09-23', TODAY)).toBe('Heute');
    expect(formatDayLabel('2026-09-22', TODAY)).toBe('Gestern');
    expect(formatDayLabel('2026-09-21', TODAY)).toBe('Montag, 21. Sept.');
  });

  test('formatDayLabel funktioniert über den Monatswechsel', () => {
    expect(formatDayLabel('2026-09-30', new Date(2026, 9, 1))).toBe('Gestern');
  });

  test('formatTime mit führender Null im 24-Stunden-Format', () => {
    expect(formatTime(new Date(2026, 8, 23, 7, 5))).toBe('07:05');
    expect(formatTime(new Date(2026, 8, 23, 20, 15))).toBe('20:15');
  });

  test('formatLongDate für das Datumsfeld im Formular', () => {
    expect(formatLongDate('2026-09-23', TODAY)).toBe('Heute, 23. Sept. 2026');
    expect(formatLongDate('2026-09-22', TODAY)).toBe('Gestern, 22. Sept. 2026');
    expect(formatLongDate('2026-08-01', TODAY)).toBe('1. Aug. 2026');
  });
});
