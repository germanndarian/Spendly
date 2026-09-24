// Datenbank der App (SQLite über expo-sqlite).
// Hier wird die Datenbank geöffnet und das Schema angelegt.
// Die eigentlichen SQL-Befehle stehen in expenses.js und settings.js.
import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'spendly.db';

// Die Datenbank wird nur einmal geöffnet. Wir merken uns das Promise,
// damit parallele Aufrufe nicht mehrere Verbindungen aufmachen.
let databasePromise = null;

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
  const row = await db.getFirstAsync('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  if (version === 0) {
    // Beträge stehen als ganze Rappen in einer INTEGER-Spalte.
    // Kommazahlen wären beim Rechnen ungenau (0.1 + 0.2 !== 0.3).
    await db.execAsync(`
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

  await db.execAsync(`PRAGMA user_version = ${version}`);
}
