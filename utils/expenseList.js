// Hilfsfunktionen für Ausgabenlisten (reine Funktionen).
import { getCategory } from './categories';
import { formatDayLabel, formatTime, toISODate } from './format';

// Neueste zuerst: nach Datum, bei gleichem Datum nach Erfassungszeit
export function sortNewestFirst(expenses) {
  // [...expenses] macht eine Kopie – sort() würde sonst die Original-Liste verändern
  return [...expenses].sort((a, b) => {
    // Daten im Format 'yyyy-mm-dd' lassen sich direkt als Text vergleichen.
    // Rückgabe 1 heisst: b kommt vor a.
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return (b.createdAt ?? 0) - (a.createdAt ?? 0);
  });
}

// Uhrzeit einer Ausgabe, z. B. "12:14" – aus dem Erfassungszeitpunkt.
// Nur wenn am selben Tag erfasst: Bei einer nachgetragenen Ausgabe wäre
// die Uhrzeit sonst die vom Nachtragen, nicht die vom Einkauf.
export function getExpenseTime(expense) {
  if (!expense.createdAt) return null;
  const created = new Date(expense.createdAt);
  return toISODate(created) === expense.date ? formatTime(created) : null;
}

// Suche (Beschreibung + Kategorie) und Kategorie-Filter.
// categoryId = null bedeutet "Alle".
export function filterExpenses(expenses, searchText, categoryId) {
  const query = searchText.trim().toLowerCase();
  return expenses.filter((expense) => {
    // Andere Kategorie als der Filter: aussortieren
    if (categoryId && expense.category !== categoryId) return false;
    // Kein Suchbegriff: alles behalten, was noch übrig ist
    if (!query) return true;
    const description = (expense.description ?? '').toLowerCase();
    const categoryLabel = getCategory(expense.category).label.toLowerCase();
    return description.includes(query) || categoryLabel.includes(query);
  });
}

// Gruppiert nach Tag für die SectionList:
// [{ title: 'Heute', totalRappen: 1620, data: [...] }, ...]
export function groupByDay(expenses, today = new Date()) {
  const sections = [];
  for (const expense of sortNewestFirst(expenses)) {
    // Die Liste ist sortiert. Gehört die Ausgabe zum gleichen Tag wie der letzte
    // Abschnitt, kommt sie dort dazu – sonst beginnt ein neuer Abschnitt.
    const last = sections[sections.length - 1];
    if (last && last.date === expense.date) {
      last.data.push(expense);
      last.totalRappen += expense.amountRappen;
    } else {
      sections.push({
        date: expense.date,
        title: formatDayLabel(expense.date, today),
        totalRappen: expense.amountRappen,
        data: [expense],
      });
    }
  }
  return sections;
}
