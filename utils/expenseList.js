// Hilfsfunktionen für Ausgabenlisten (reine Funktionen).
import { getCategory } from './categories';
import { formatDayLabel } from './format';

// Neueste zuerst: nach Datum, bei gleichem Datum nach Erfassungszeit
export function sortNewestFirst(expenses) {
  return [...expenses].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return (b.createdAt ?? 0) - (a.createdAt ?? 0);
  });
}

// Suche (Beschreibung + Kategorie) und Kategorie-Filter.
// categoryId = null bedeutet "Alle".
export function filterExpenses(expenses, searchText, categoryId) {
  const query = searchText.trim().toLowerCase();
  return expenses.filter((expense) => {
    if (categoryId && expense.category !== categoryId) return false;
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
