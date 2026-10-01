// Die App-Abfragen laufen gegen echtes SQLite im Node-Testprozess.
// Nur die asynchrone Expo-Anbindung wird durch einen kleinen Adapter ersetzt.
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

let mockDatabase;
let mockAdapter;
let mockFailure;

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: async () => mockAdapter }));
jest.mock('expo-crypto', () => ({ randomUUID: () => require('node:crypto').randomUUID() }));

function query(sql, params, kind) {
  if (mockFailure && sql.includes(mockFailure)) throw new Error('Simulierter Schreibfehler');
  if (kind === 'exec') return mockDatabase.exec(sql);
  return mockDatabase.prepare(sql)[kind](...params);
}

beforeEach(() => {
  jest.resetModules();
  jest.useFakeTimers().setSystemTime(new Date('2026-10-01T08:00:00Z'));
  mockDatabase = new DatabaseSync(':memory:');
  mockFailure = null;
  mockAdapter = {
    execAsync: async (sql) => query(sql, [], 'exec'),
    runAsync: async (sql, ...params) => query(sql, params, 'run'),
    getAllAsync: async (sql, ...params) => query(sql, params, 'all'),
    getFirstAsync: async (sql, ...params) => query(sql, params, 'get'),
    withExclusiveTransactionAsync: async (action) => {
      mockDatabase.exec('BEGIN IMMEDIATE');
      try {
        await action(mockAdapter);
        mockDatabase.exec('COMMIT');
      } catch (error) {
        mockDatabase.exec('ROLLBACK');
        throw error;
      }
    },
  };
});
afterEach(() => { mockDatabase.close(); jest.useRealTimers(); });

function oldInstallation() {
  mockDatabase.exec(`
    CREATE TABLE expenses (id TEXT PRIMARY KEY NOT NULL, amount_rappen INTEGER NOT NULL, category TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '', date TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    INSERT INTO settings VALUES ('budgetRappen', '90000');
    INSERT INTO expenses VALUES ('alt', 1250, 'food', 'Migros', '2026-09-30', 123);
    PRAGMA user_version = 1;
  `);
}

const input = { amountRappen: 1250, category: 'food', description: 'Migros', date: '2026-10-01' };

describe('Schema und Monatsbudgets', () => {
  test('eine neue Installation startet ohne erfundenes Budget', async () => {
    const { ensureMonthBudget, listMonthBudgets } = require('../budgets');
    expect(await ensureMonthBudget('2026-10', null)).toBeNull();
    expect(await listMonthBudgets()).toEqual([]);
    expect(mockDatabase.prepare('PRAGMA user_version').get().user_version).toBe(2);
  });

  test('Version 1 migriert Ausgaben und globales Budget ohne Verlust', async () => {
    oldInstallation();
    const { getDatabase } = require('../db');
    await getDatabase();
    expect(mockDatabase.prepare('SELECT * FROM expenses').get()).toMatchObject({ id: 'alt', amount_rappen: 1250, pending_delete_until: null });
    expect(mockDatabase.prepare('SELECT * FROM monthly_budgets ORDER BY month').all()).toEqual([
      { month: '2026-09', amount_rappen: 90000 }, { month: '2026-10', amount_rappen: 90000 },
    ]);
    expect(mockDatabase.prepare("SELECT value FROM settings WHERE key='defaultBudgetRappen'").get().value).toBe('90000');
  });

  test('fehlgeschlagene Migration rollt Schema zurück und lässt sich wiederholen', async () => {
    oldInstallation();
    mockFailure = 'ALTER TABLE';
    const { getDatabase } = require('../db');
    await expect(getDatabase()).rejects.toThrow('Simulierter');
    expect(mockDatabase.prepare('PRAGMA user_version').get().user_version).toBe(1);
    expect(mockDatabase.prepare("SELECT name FROM sqlite_master WHERE name='monthly_budgets'").get()).toBeUndefined();
    mockFailure = null;
    await getDatabase();
    expect(mockDatabase.prepare('PRAGMA user_version').get().user_version).toBe(2);
  });

  test('neue Vorgabe gilt erst für neue Monate; Vergangenheit und gespeicherte Zukunft bleiben erhalten', async () => {
    const { saveMonthBudget, ensureMonthBudget } = require('../budgets');
    const { loadSettings } = require('../settings');
    await saveMonthBudget('2026-09', 80000);
    await saveMonthBudget('2026-11', 70000);
    await saveMonthBudget('2026-10', 95000, true);
    const settings = await loadSettings();
    expect(settings.defaultBudgetRappen).toBe(95000);
    expect(await ensureMonthBudget('2026-09', settings.defaultBudgetRappen)).toBe(80000);
    expect(await ensureMonthBudget('2026-11', settings.defaultBudgetRappen)).toBe(70000);
    expect(await ensureMonthBudget('2026-12', settings.defaultBudgetRappen)).toBe(95000);
  });

  test('Budget und künftige Vorgabe speichern atomar', async () => {
    const { saveMonthBudget, ensureMonthBudget } = require('../budgets');
    await saveMonthBudget('2026-10', 80000);
    mockFailure = "'defaultBudgetRappen'";
    await expect(saveMonthBudget('2026-10', 95000, true)).rejects.toThrow();
    mockFailure = null;
    expect(await ensureMonthBudget('2026-10', null)).toBe(80000);
  });
});

describe('Ausgaben und dauerhafte Löschfrist', () => {
  test('Ausgabe und letzte Kategorie speichern atomar', async () => {
    const expenses = require('../expenses');
    await require('../db').getDatabase();
    mockFailure = "'lastCategory'";
    await expect(expenses.addExpense(input)).rejects.toThrow();
    mockFailure = null;
    expect(await expenses.listExpenses()).toEqual([]);
  });

  test('Löschen entfernt den Betrag sofort aus Listen und Summen; Undo behält die id', async () => {
    const expenses = require('../expenses');
    const expense = await expenses.addExpense(input);
    await expenses.deleteExpense(expense.id);
    expect(await expenses.listExpenses()).toEqual([]);
    expect(await expenses.getMonthTotalRappen('2026-10')).toBe(0);
    expect((await expenses.getDailyTotalsRappen('2026-10', 31))[0]).toBe(0);
    expect(mockDatabase.prepare('SELECT count(*) AS n FROM expenses').get().n).toBe(1);
    jest.advanceTimersByTime(4999);
    expect(await expenses.restoreExpense(expense)).toBe(true);
    expect((await expenses.listExpenses())[0].id).toBe(expense.id);
    expect(await expenses.getMonthTotalRappen('2026-10')).toBe(1250);
  });

  test('Löschfrist überlebt neuen Modulstart und lässt nach fünf Sekunden kein Undo mehr zu', async () => {
    let expenses = require('../expenses');
    const expense = await expenses.addExpense(input);
    const deadline = await expenses.deleteExpense(expense.id);
    jest.resetModules();
    expenses = require('../expenses');
    expect((await expenses.getPendingDelete()).deadline).toBe(deadline);
    jest.advanceTimersByTime(5000);
    expect(await expenses.restoreExpense(expense)).toBe(false);
    await expenses.finishPendingDeletes();
    expect(mockDatabase.prepare('SELECT count(*) AS n FROM expenses').get().n).toBe(0);
  });

  test('historischer Monatsverlauf enthält Monatsausgaben und unabhängiges Budget', async () => {
    const expenses = require('../expenses');
    const budgets = require('../budgets');
    await expenses.addExpense({ ...input, date: '2026-09-15' });
    await budgets.saveMonthBudget('2026-09', 80000);
    await budgets.saveMonthBudget('2026-10', 90000);
    expect(await budgets.listMonthBudgets()).toEqual([
      { month: '2026-10', budgetRappen: 90000, spentRappen: 0 },
      { month: '2026-09', budgetRappen: 80000, spentRappen: 1250 },
    ]);
  });
});
