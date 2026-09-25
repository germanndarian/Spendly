// Alle SQL-Befehle rund um die Ausgaben.
// Ausserhalb dieser Datei wird nie direkt auf die Tabelle zugegriffen.
import * as Crypto from 'expo-crypto';
import { getDatabase } from './db';

// Die Spalten der Tabelle – einmal hier, damit SELECT und INSERT zusammenpassen
const COLUMNS = 'id, amount_rappen, category, description, date, created_at';

// Datenbankzeile (snake_case) -> Objekt, wie es die App verwendet (camelCase)
function toExpense(row) {
  return {
    id: row.id,
    amountRappen: row.amount_rappen,
    category: row.category,
    description: row.description,
    date: row.date,
    createdAt: row.created_at,
  };
}

// Alle Ausgaben, neueste zuerst.
export async function listExpenses() {
  const db = await getDatabase();
  // getAllAsync liefert alle passenden Zeilen als Liste.
  // ORDER BY sortiert: neuestes Datum zuerst, am gleichen Tag die neueste Erfassung zuerst.
  const rows = await db.getAllAsync(
    `SELECT ${COLUMNS} FROM expenses ORDER BY date DESC, created_at DESC`
  );
  // Jede Datenbank-Zeile in ein Ausgaben-Objekt für die App umwandeln
  return rows.map(toExpense);
}

// Eine einzelne Ausgabe (zum Bearbeiten), oder null.
export async function getExpense(id) {
  const db = await getDatabase();
  // Das ? ist ein Platzhalter. SQLite setzt die id sicher ein – so kann
  // niemand über eine Eingabe eigene SQL-Befehle einschleusen (SQL-Injection).
  const row = await db.getFirstAsync(`SELECT ${COLUMNS} FROM expenses WHERE id = ?`, id);
  return row ? toExpense(row) : null;
}

// Neue Ausgabe anlegen. Die id erzeugen wir selbst, damit sie stabil bleibt.
export async function addExpense({ amountRappen, category, description, date }) {
  const expense = {
    // Zufällige, eindeutige id, z. B. '3f1c…'
    id: Crypto.randomUUID(),
    amountRappen,
    category,
    description: description ?? '',
    date,
    // Jetzt, als Millisekunden seit 1970
    createdAt: Date.now(),
  };
  await insert(expense);
  return expense;
}

// Bestehende Ausgabe ändern. Das Erfassungsdatum (created_at) bleibt gleich.
export async function updateExpense(id, { amountRappen, category, description, date }) {
  const db = await getDatabase();
  await db.runAsync(
    // Die ? werden der Reihe nach durch die Werte darunter ersetzt
    'UPDATE expenses SET amount_rappen = ?, category = ?, description = ?, date = ? WHERE id = ?',
    amountRappen,
    category,
    description ?? '',
    date,
    id
  );
}

export async function deleteExpense(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM expenses WHERE id = ?', id);
}

// Für "Rückgängig" nach dem Löschen: die Ausgabe mit gleicher id zurückschreiben.
export async function restoreExpense(expense) {
  await insert(expense);
}

export async function deleteAllExpenses() {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM expenses');
}

// Mehrere Ausgaben auf einmal (Demo-Daten). Eine Transaktion ist deutlich
// schneller als 40 einzelne INSERTs.
export async function addManyExpenses(expenses) {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const expense of expenses) {
      await insert(expense);
    }
  });
}

// Summe eines Monats ('2026-09'), direkt in SQL gerechnet.
export async function getMonthTotalRappen(monthPrefix) {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    // SUM zählt alle Beträge zusammen. COALESCE macht aus «keine Ausgaben» (NULL)
    // eine 0. LIKE '2026-09-%' findet alle Tage im September.
    'SELECT COALESCE(SUM(amount_rappen), 0) AS total FROM expenses WHERE date LIKE ?',
    `${monthPrefix}-%`
  );
  return row?.total ?? 0;
}

// Tagessummen eines Monats für den Monatsstreifen.
// Ergebnis: Array mit einem Wert pro Tag (Index 0 = 1. Tag des Monats).
export async function getDailyTotalsRappen(monthPrefix, daysInMonth) {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    // GROUP BY date: eine Summe pro Tag statt einer für den ganzen Monat
    'SELECT date, SUM(amount_rappen) AS total FROM expenses WHERE date LIKE ? GROUP BY date',
    `${monthPrefix}-%`
  );

  // Liste mit einer 0 pro Tag. Tage ohne Ausgaben bleiben einfach 0.
  const totals = new Array(daysInMonth).fill(0);
  for (const row of rows) {
    // '2026-09-07' -> Tag 7 -> Index 6
    const day = Number(row.date.slice(8, 10));
    if (day >= 1 && day <= daysInMonth) {
      totals[day - 1] = row.total;
    }
  }
  return totals;
}

// Gemeinsames INSERT für neue, wiederhergestellte und Demo-Ausgaben.
async function insert(expense) {
  const db = await getDatabase();
  await db.runAsync(
    // Sechs Platzhalter für die sechs Spalten
    `INSERT INTO expenses (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?)`,
    expense.id,
    expense.amountRappen,
    expense.category,
    expense.description ?? '',
    expense.date,
    expense.createdAt
  );
}
