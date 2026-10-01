// Datenbank der App (SQLite über expo-sqlite).
// Hier wird die Datenbank geöffnet und das Schema angelegt.
// Die eigentlichen SQL-Befehle stehen in expenses.js und settings.js.
import * as SQLite from 'expo-sqlite';
import { toISODate } from '../utils/format';

const DATABASE_NAME = 'spendly.db';

// Die Datenbank wird nur einmal geöffnet. Wir merken uns das Promise,
// damit parallele Aufrufe nicht mehrere Verbindungen aufmachen.
let databasePromise = null;

// Alle anderen Dateien holen die Datenbank über diese Funktion.
// Beim ersten Aufruf wird sie geöffnet, danach immer dieselbe zurückgegeben.
export function getDatabase() {
  if (!databasePromise) {
    databasePromise = openDatabase();
  }
  return databasePromise;
}

async function openDatabase() {
  try {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    // WAL erlaubt Lesen und Schreiben gleichzeitig (Empfehlung von Expo).
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await migrate(db);
    return db;
  } catch (error) {
    // Beim nächsten Versuch soll es wieder gehen ("Erneut versuchen").
    databasePromise = null;
    throw error;
  }
}

// Die Schema-Version steht in "PRAGMA user_version".
// So können wir später Spalten ergänzen, ohne bestehende Daten zu verlieren.
async function migrate(db) {
  // Aktuelle Version lesen. Eine ganz neue Datenbank hat Version 0.
  const row = await db.getFirstAsync('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  await db.withExclusiveTransactionAsync(async (transaction) => {
    const existingInstallation = version > 0;
    if (version === 0) {
      // Version 0 -> 1: die beiden Tabellen anlegen.
      // - expenses: eine Zeile pro Ausgabe
      // - settings: Einstellungen als Schlüssel/Wert
      // Der Index auf «date» macht die Suche nach einem Monat schneller.
      // Beträge stehen als ganze Rappen in einer INTEGER-Spalte.
      // Kommazahlen wären beim Rechnen ungenau (0.1 + 0.2 !== 0.3).
      await transaction.execAsync(`
        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY NOT NULL,
          amount_rappen INTEGER NOT NULL,
          category TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          date TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date);
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `);
      version = 1;
    }

    if (version === 1) {
      await transaction.execAsync(`
        CREATE TABLE IF NOT EXISTS monthly_budgets (
          month TEXT PRIMARY KEY NOT NULL,
          amount_rappen INTEGER NOT NULL CHECK (amount_rappen > 0)
        );
        ALTER TABLE expenses ADD COLUMN pending_delete_until INTEGER;
      `);
      // Die bisherige globale Vorgabe bleibt für bestehende Daten erhalten.
      // Historische Beträge vor dieser Migration wurden noch nicht einzeln erfasst.
      if (existingInstallation) {
        const oldBudget = await transaction.getFirstAsync("SELECT value FROM settings WHERE key = 'budgetRappen'");
        const amount = Number(oldBudget?.value ?? 80000);
        if (Number.isSafeInteger(amount) && amount > 0) {
          await transaction.runAsync(
            'INSERT OR IGNORE INTO monthly_budgets (month, amount_rappen) SELECT DISTINCT substr(date, 1, 7), ? FROM expenses',
            amount
          );
          await transaction.runAsync('INSERT OR IGNORE INTO monthly_budgets VALUES (?, ?)', toISODate(new Date()).slice(0, 7), amount);
          await transaction.runAsync("INSERT OR IGNORE INTO settings (key, value) VALUES ('defaultBudgetRappen', ?)", String(amount));
        }
      }
      version = 2;
    }

    // Neue Version speichern, damit beim nächsten Start nichts doppelt passiert
    await transaction.execAsync(`PRAGMA user_version = ${version}`);
  });
}
