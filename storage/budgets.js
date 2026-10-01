// Ein Budget gehört genau zu einem Monat. Eine neue Vorgabe ändert keine Vergangenheit.
import { getDatabase } from './db';

export async function ensureMonthBudget(month, defaultBudgetRappen) {
  const db = await getDatabase();
  if (Number.isSafeInteger(defaultBudgetRappen) && defaultBudgetRappen > 0) {
    await db.runAsync('INSERT OR IGNORE INTO monthly_budgets (month, amount_rappen) VALUES (?, ?)', month, defaultBudgetRappen);
  }
  const row = await db.getFirstAsync('SELECT amount_rappen FROM monthly_budgets WHERE month = ?', month);
  return row?.amount_rappen ?? null;
}

export async function saveMonthBudget(month, amountRappen, useForFuture = false) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !Number.isSafeInteger(amountRappen) || amountRappen <= 0) {
    throw new Error('Monat oder Budget ungültig.');
  }
  const db = await getDatabase();
  // Monatsbudget und optionale Vorgabe werden zusammen gespeichert oder gar nicht.
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync(
      'INSERT INTO monthly_budgets (month, amount_rappen) VALUES (?, ?) ON CONFLICT(month) DO UPDATE SET amount_rappen = excluded.amount_rappen',
      month, amountRappen
    );
    if (useForFuture) {
      await transaction.runAsync(
        "INSERT INTO settings (key, value) VALUES ('defaultBudgetRappen', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        String(amountRappen)
      );
    }
  });
}

export async function listMonthBudgets() {
  const db = await getDatabase();
  // Auch ein Monat mit Ausgaben, aber ohne Budget bleibt im Verlauf sichtbar.
  const rows = await db.getAllAsync(`
    WITH months AS (
      SELECT month FROM monthly_budgets
      UNION SELECT substr(date, 1, 7) FROM expenses WHERE pending_delete_until IS NULL
    )
    SELECT months.month, b.amount_rappen,
      COALESCE((SELECT SUM(e.amount_rappen) FROM expenses e
        WHERE substr(e.date, 1, 7) = months.month AND e.pending_delete_until IS NULL), 0) AS spent_rappen
    FROM months LEFT JOIN monthly_budgets b ON b.month = months.month
    ORDER BY months.month DESC
  `);
  return rows.map((row) => ({ month: row.month, budgetRappen: row.amount_rappen, spentRappen: row.spent_rappen }));
}
