// Prüfregeln für die Formulare (reine Funktionen, damit sie testbar sind).
// Jede Funktion gibt entweder null (alles gut) oder den Fehlertext zurück.
// Die Texte sagen, was falsch ist UND wie man es behebt.
import { countDecimals, parseAmountToRappen, toISODate } from './format';

export const MAX_DESCRIPTION_LENGTH = 40;

// Betrag: Pflichtfeld, grösser als 0, höchstens 2 Nachkommastellen
export function validateAmount(text) {
  const value = String(text).trim();
  if (!value) {
    return 'Betrag ist ein Pflichtfeld.';
  }
  // Die Prüfungen laufen der Reihe nach. Die erste, die nicht passt,
  // liefert die Fehlermeldung.
  const rappen = parseAmountToRappen(value);
  if (rappen === null) {
    return 'Bitte nur Zahlen eingeben, z. B. 12.50.';
  }
  if (countDecimals(value) > 2) {
    return 'Höchstens 2 Nachkommastellen.';
  }
  if (rappen <= 0) {
    return 'Betrag muss grösser als CHF 0.00 sein.';
  }
  return null;
}

// Kategorie: Pflichtfeld
export function validateCategory(categoryId) {
  return categoryId ? null : 'Bitte eine Kategorie wählen.';
}

// Beschreibung: optional, höchstens 40 Zeichen
export function validateDescription(text) {
  return String(text).length > MAX_DESCRIPTION_LENGTH
    ? `Höchstens ${MAX_DESCRIPTION_LENGTH} Zeichen.`
    : null;
}

// Datum: nicht in der Zukunft ('yyyy-mm-dd' lässt sich direkt vergleichen)
export function validateDate(isoDate, today = new Date()) {
  return isoDate > toISODate(today) ? 'Datum darf nicht in der Zukunft liegen.' : null;
}

// Das ganze Formular auf einmal prüfen.
export function validateExpense({ amountText, categoryId, description, date }, today = new Date()) {
  const errors = {
    amount: validateAmount(amountText),
    category: validateCategory(categoryId),
    description: validateDescription(description),
    date: validateDate(date, today),
  };
  // Gültig, wenn kein einziges Feld einen Fehler hat
  const isValid = Object.values(errors).every((error) => error === null);
  return { errors, isValid };
}

// Monatsbudget in den Einstellungen
export function validateBudget(text) {
  const value = String(text).trim();
  if (!value) {
    return 'Budget ist ein Pflichtfeld.';
  }
  const rappen = parseAmountToRappen(value);
  if (rappen === null) {
    return 'Bitte nur Zahlen eingeben, z. B. 800.';
  }
  if (countDecimals(value) > 2) {
    return 'Höchstens 2 Nachkommastellen.';
  }
  if (rappen <= 0) {
    return 'Budget muss grösser als CHF 0.00 sein.';
  }
  return null;
}
