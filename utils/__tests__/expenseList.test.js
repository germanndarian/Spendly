// Unit-Tests für utils/expenseList.js und utils/categories.js
import { CATEGORIES, getCategory } from '../categories';
import { filterExpenses, groupByDay, sortNewestFirst } from '../expenseList';

const TODAY = new Date(2026, 8, 23);

// Kleine Beispiel-Liste wie im Mockup "Verlauf" (bewusst durcheinander)
const EXPENSES = [
  { id: 'kino', amountRappen: 1950, category: 'leisure', description: 'Kino Arena Sihlcity', date: '2026-09-22', createdAt: 3 },
  { id: 'sbb', amountRappen: 440, category: 'transport', description: 'SBB Mobile', date: '2026-09-23', createdAt: 4 },
  { id: 'spotify', amountRappen: 1395, category: 'subscriptions', description: 'Spotify Premium', date: '2026-09-21', createdAt: 1 },
  { id: 'migros', amountRappen: 1180, category: 'food', description: 'Migros', date: '2026-09-23', createdAt: 5 },
  { id: 'coop', amountRappen: 1290, category: 'food', description: '', date: '2026-09-22', createdAt: 2 },
];

const ids = (list) => list.map((expense) => expense.id);

describe('getCategory', () => {
  test('es gibt genau sechs Kategorien', () => {
    expect(CATEGORIES).toHaveLength(6);
  });

  test('findet eine Kategorie über die id', () => {
    expect(getCategory('transport').label).toBe('Mobilität');
  });

  test('unbekannte ids landen bei "Sonstiges"', () => {
    expect(getCategory('gibt-es-nicht').id).toBe('other');
  });
});

describe('sortNewestFirst', () => {
  test('sortiert nach Datum, bei gleichem Datum nach Erfassungszeit', () => {
    expect(ids(sortNewestFirst(EXPENSES))).toEqual(['migros', 'sbb', 'kino', 'coop', 'spotify']);
  });

  test('verändert die Original-Liste nicht', () => {
    const before = ids(EXPENSES);
    sortNewestFirst(EXPENSES);
    expect(ids(EXPENSES)).toEqual(before);
  });
});

describe('filterExpenses', () => {
  test('ohne Suche und Filter kommt alles zurück', () => {
    expect(filterExpenses(EXPENSES, '', null)).toHaveLength(5);
  });

  test('sucht in der Beschreibung, ohne auf Gross-/Kleinschreibung zu achten', () => {
    expect(ids(filterExpenses(EXPENSES, 'migros', null))).toEqual(['migros']);
    expect(ids(filterExpenses(EXPENSES, '  SBB ', null))).toEqual(['sbb']);
  });

  test('sucht auch im Kategorienamen', () => {
    // "Coop" hat keine Beschreibung, wird aber über "Essen & Trinken" gefunden
    expect(ids(filterExpenses(EXPENSES, 'essen', null))).toEqual(['migros', 'coop']);
  });

  test('filtert nach Kategorie', () => {
    expect(ids(filterExpenses(EXPENSES, '', 'food'))).toEqual(['migros', 'coop']);
  });

  test('Suche und Filter zusammen', () => {
    expect(ids(filterExpenses(EXPENSES, 'migros', 'transport'))).toEqual([]);
  });

  test('keine Treffer ergeben eine leere Liste', () => {
    expect(filterExpenses(EXPENSES, 'Zalando', null)).toEqual([]);
  });
});

describe('groupByDay', () => {
  test('bildet einen Abschnitt pro Tag, neuester zuerst', () => {
    const sections = groupByDay(EXPENSES, TODAY);
    expect(sections.map((section) => section.title)).toEqual(['Heute', 'Gestern', 'Montag, 21. Sept.']);
  });

  test('rechnet die Tagessumme wie im Mockup', () => {
    const [today, yesterday, monday] = groupByDay(EXPENSES, TODAY);
    expect(today.totalRappen).toBe(1620); // CHF 16.20
    expect(yesterday.totalRappen).toBe(3240); // CHF 32.40
    expect(monday.totalRappen).toBe(1395); // CHF 13.95
    expect(ids(today.data)).toEqual(['migros', 'sbb']);
  });

  test('eine leere Liste ergibt keine Abschnitte', () => {
    expect(groupByDay([], TODAY)).toEqual([]);
  });
});
