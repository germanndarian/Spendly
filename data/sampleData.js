// Statische Beispieldaten für Phase 1 (nur zur Anzeige der Screens).
// Ab Phase 2 kommen die echten Daten aus dem Speicher (storage/expenses.js)
// und diese Datei wird nicht mehr gebraucht.
import { toISODate } from '../utils/format';

// Datum von vor n Tagen als "yyyy-mm-dd"
function daysAgo(n) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return toISODate(date);
}

export const SAMPLE_EXPENSES = [
  { id: '1', amountRappen: 1180, category: 'food', description: 'Migros', date: daysAgo(0) },
  { id: '2', amountRappen: 440, category: 'transport', description: 'SBB Mobile', date: daysAgo(0) },
  { id: '3', amountRappen: 1950, category: 'leisure', description: 'Kino Arena Sihlcity', date: daysAgo(1) },
  { id: '4', amountRappen: 1290, category: 'food', description: 'Coop to go', date: daysAgo(1) },
  { id: '5', amountRappen: 1395, category: 'subscriptions', description: 'Spotify Premium', date: daysAgo(2) },
];

export const SAMPLE_BUDGET_RAPPEN = 80000; // CHF 800.00
export const SAMPLE_SPENT_RAPPEN = 60400; // CHF 604.00

// Tagessummen für den Monatsstreifen (Rappen pro Tag, Tag 1 bis heute)
// (zwei Tage liegen über dem Tagesbudget von ca. CHF 26.65)
const PATTERN = [
  2100, 2400, 1700, 4400, 1900, 2200, 1000, 2300, 2400, 2000, 2500, 4800, 1400, 1800, 2500,
  2600, 1100, 2300, 2100, 1600, 2600, 2200, 1620,
];
export function sampleDailyTotals(today = new Date()) {
  const totals = [];
  for (let day = 1; day <= today.getDate(); day++) {
    totals.push(PATTERN[(day - 1) % PATTERN.length]);
  }
  return totals;
}
