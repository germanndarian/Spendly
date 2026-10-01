// Alle SQL-Befehle rund um die Ausgaben.
// Ausserhalb dieser Datei wird nie direkt auf die Tabelle zugegriffen.
import * as Crypto from 'expo-crypto';
import { getDatabase } from './db';

// Die Spalten der Tabelle – einmal hier, damit SELECT und INSERT zusammenpassen
const COLUMNS = 'id, amount_rappen, category, description, date, created_at';
export const UNDO_DURATION_MS = 5000;

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
    `SELECT ${COLUMNS} FROM expenses WHERE pending_delete_until IS NULL ORDER BY date DESC, created_at DESC`
  );
  // Jede Datenbank-Zeile in ein Ausgaben-Objekt für die App umwandeln
  return rows.map(toExpense);
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
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await insert(expense, transaction);
    await rememberCategory(transaction, category);
  });
  return expense;
}

// Bestehende Ausgabe ändern. Das Erfassungsdatum (created_at) bleibt gleich.
export async function updateExpense(id, { amountRappen, category, description, date }) {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (transaction) => {
    const result = await transaction.runAsync(
      // Die ? werden der Reihe nach durch die Werte darunter ersetzt
      'UPDATE expenses SET amount_rappen = ?, category = ?, description = ?, date = ? WHERE id = ? AND pending_delete_until IS NULL',
      amountRappen,
      category,
      description ?? '',
      date,
      id
    );
    if (result.changes === 0) throw new Error('Ausgabe wurde inzwischen gelöscht.');
    await rememberCategory(transaction, category);
  });
}

export async function deleteExpense(id) {
  const db = await getDatabase();
  const deadline = Date.now() + UNDO_DURATION_MS;
  await db.runAsync('UPDATE expenses SET pending_delete_until = ? WHERE id = ? AND pending_delete_until IS NULL', deadline, id);
  return deadline;
}

// Die Zeile bleibt fünf Sekunden gespeichert. Auch ein App-Neustart verliert
// weder die Ausgabe noch ihre Löschfrist; ein abgelaufenes Undo ist unmöglich.
export async function restoreExpense(expense) {
  const db = await getDatabase();
  const result = await db.runAsync(
    'UPDATE expenses SET pending_delete_until = NULL WHERE id = ? AND pending_delete_until > ?',
    expense.id, Date.now()
  );
  return result.changes > 0;
}

export async function finishPendingDeletes() {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM expenses WHERE pending_delete_until <= ?', Date.now());
}

export async function getPendingDelete() {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    `SELECT ${COLUMNS}, pending_delete_until FROM expenses WHERE pending_delete_until > ? ORDER BY pending_delete_until DESC LIMIT 1`,
    Date.now()
  );
  return row ? { ...toExpense(row), deadline: row.pending_delete_until } : null;
}

export async function deleteAllExpenses() {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM expenses');
}

// Mehrere Ausgaben auf einmal (Demo-Daten). Eine Transaktion ist deutlich
// schneller als 40 einzelne INSERTs.
export async function addManyExpenses(expenses) {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (transaction) => {
    for (const expense of expenses) {
      await insert(expense, transaction);
    }
  });
}

// Summe eines Monats ('2026-09'), direkt in SQL gerechnet.
export async function getMonthTotalRappen(monthPrefix) {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    // SUM zählt alle Beträge zusammen. COALESCE macht aus «keine Ausgaben» (NULL)
    // eine 0. LIKE '2026-09-%' findet alle Tage im September.
    'SELECT COALESCE(SUM(amount_rappen), 0) AS total FROM expenses WHERE date LIKE ? AND pending_delete_until IS NULL',
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
    'SELECT date, SUM(amount_rappen) AS total FROM expenses WHERE date LIKE ? AND pending_delete_until IS NULL GROUP BY date',
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
async function insert(expense, connection) {
  const db = connection ?? await getDatabase();
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

// Kategorie und Ausgabe gehören zu einer Aktion. Ein Fehler darf keine
// halb gespeicherte Ausgabe hinterlassen, die beim Wiederholen doppelt entsteht.
async function rememberCategory(transaction, category) {
  await transaction.runAsync(
    "INSERT INTO settings (key, value) VALUES ('lastCategory', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    category
  );
}
