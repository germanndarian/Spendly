// Unit-Tests für utils/validation.js
// Die Regeln stammen aus dem Konzept (Screen 3 · Neue Ausgabe).
import {
  MAX_DESCRIPTION_LENGTH,
  validateAmount,
  validateBudget,
  validateCategory,
  validateDate,
  validateDescription,
  validateExpense,
} from '../validation';

const TODAY = new Date(2026, 8, 23);

// Für jede Regel gibt es gültige und ungültige Beispiele.
// null heisst: kein Fehler.
describe('validateAmount (Pflichtfeld, > 0, max. 2 Nachkommastellen)', () => {
  test('gültige Beträge ergeben keinen Fehler', () => {
    expect(validateAmount('6.80')).toBeNull();
    expect(validateAmount('6,80')).toBeNull();
    expect(validateAmount('12')).toBeNull();
    expect(validateAmount('0.05')).toBeNull();
  });

  test('leeres Feld', () => {
    expect(validateAmount('')).toBe('Betrag ist ein Pflichtfeld.');
    expect(validateAmount('   ')).toBe('Betrag ist ein Pflichtfeld.');
  });

  test('keine Zahl', () => {
    expect(validateAmount('abc')).toBe('Bitte nur Zahlen eingeben, z. B. 12.50.');
  });

  test('mehr als 2 Nachkommastellen', () => {
    expect(validateAmount('12.505')).toBe('Höchstens 2 Nachkommastellen.');
  });

  test('0 oder weniger', () => {
    expect(validateAmount('0')).toBe('Betrag muss grösser als CHF 0.00 sein.');
    expect(validateAmount('0.00')).toBe('Betrag muss grösser als CHF 0.00 sein.');
  });
});

describe('validateCategory (Pflichtfeld)', () => {
  test('mit und ohne Kategorie', () => {
    expect(validateCategory('food')).toBeNull();
    expect(validateCategory(null)).toBe('Bitte eine Kategorie wählen.');
  });
});

describe('validateDescription (optional, max. 40 Zeichen)', () => {
  test('leer ist erlaubt', () => {
    expect(validateDescription('')).toBeNull();
  });

  test('genau 40 Zeichen sind erlaubt, 41 nicht', () => {
    expect(validateDescription('a'.repeat(MAX_DESCRIPTION_LENGTH))).toBeNull();
    expect(validateDescription('a'.repeat(MAX_DESCRIPTION_LENGTH + 1))).toBe('Höchstens 40 Zeichen.');
  });
});

describe('validateDate (nicht in der Zukunft)', () => {
  test('heute und die Vergangenheit sind erlaubt', () => {
    expect(validateDate('2026-09-23', TODAY)).toBeNull();
    expect(validateDate('2025-12-31', TODAY)).toBeNull();
  });

  test('morgen ist nicht erlaubt', () => {
    expect(validateDate('2026-09-24', TODAY)).toBe('Datum darf nicht in der Zukunft liegen.');
  });
});

describe('validateExpense (ganzes Formular)', () => {
  const valid = { amountText: '6.80', categoryId: 'food', description: 'Gipfeli & Kaffee', date: '2026-09-23' };

  test('ein vollständiges Formular ist gültig', () => {
    const result = validateExpense(valid, TODAY);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({ amount: null, category: null, description: null, date: null });
  });

  test('ein einziger Fehler macht das Formular ungültig', () => {
    expect(validateExpense({ ...valid, categoryId: null }, TODAY).isValid).toBe(false);
    expect(validateExpense({ ...valid, amountText: '' }, TODAY).isValid).toBe(false);
    expect(validateExpense({ ...valid, date: '2026-10-01' }, TODAY).isValid).toBe(false);
  });

  test('meldet alle Fehler gleichzeitig', () => {
    const { errors } = validateExpense({ amountText: '0', categoryId: null, description: '', date: '2026-09-23' }, TODAY);
    expect(errors.amount).not.toBeNull();
    expect(errors.category).not.toBeNull();
    expect(errors.description).toBeNull();
  });
});

describe('validateBudget (Einstellungen)', () => {
  test('gültige Budgets', () => {
    expect(validateBudget('800')).toBeNull();
    expect(validateBudget('1250.50')).toBeNull();
  });

  test('ungültige Budgets', () => {
    expect(validateBudget('')).toBe('Budget ist ein Pflichtfeld.');
    expect(validateBudget('viel')).toBe('Bitte nur Zahlen eingeben, z. B. 800.');
    expect(validateBudget('0')).toBe('Budget muss grösser als CHF 0.00 sein.');
    expect(validateBudget('800.001')).toBe('Höchstens 2 Nachkommastellen.');
  });
});
