// Stellt allen Screens die gespeicherten Daten zur Verfügung:
// Ausgaben, Monatsbudget und Einstellungen.
// Die Screens sprechen nie direkt mit der Datenbank, sondern nur über diesen Hook.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { getDaysInMonth } from '../utils/budget';
import { toISODate } from '../utils/format';
import {
  addExpense,
  addManyExpenses,
  deleteExpense,
  finishPendingDeletes,
  getDailyTotalsRappen,
  getMonthTotalRappen,
  getPendingDelete,
  listExpenses,
  restoreExpense,
  updateExpense,
} from './expenses';
import { DEFAULT_SETTINGS, loadSettings, saveSetting } from './settings';
import { clearPin } from './pin';
import { ensureMonthBudget, listMonthBudgets, saveMonthBudget } from './budgets';
import { getDatabase } from './db';

// Gemeinsamer Speicher für alle Daten (gleiches Prinzip wie ThemeContext)
const DataContext = createContext(null);

// Umschliesst die ganze App (siehe App.js). Alles darunter kann useData() verwenden.
export function DataProvider({ children }) {
  // 'loading' beim Start, 'error' wenn die Datenbank nicht antwortet
  const [status, setStatus] = useState('loading');
  // useState merkt sich einen Wert. Ruft man z. B. setExpenses(...) auf,
  // zeichnet React alle Screens neu, die diesen Wert anzeigen.
  // Alle Ausgaben, neueste zuerst:
  const [expenses, setExpenses] = useState([]);
  // Einstellungen (Budget, Face ID, Sperrzeit …), zuerst die Standardwerte
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  // Summen für die Übersicht – die rechnet SQLite direkt aus
  const [summary, setSummary] = useState({ monthTotalRappen: 0, dailyTotals: [], budgetRappen: null, month: toISODate(new Date()).slice(0, 7) });
  const [budgetHistory, setBudgetHistory] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);
  // Kurze Rückmeldung am unteren Rand (z. B. nach dem Löschen).
  // Sie steht hier, damit sie auch nach dem Schliessen eines Modals sichtbar ist.
  const [snackbar, setSnackbar] = useState(null);

  // Alles neu aus der Datenbank lesen (ohne Ladeanzeige).
  const refresh = useCallback(async function refreshData() {
    const today = new Date();
    const monthPrefix = toISODate(today).slice(0, 7); // '2026-09'
    const daysInMonth = getDaysInMonth(today);

    await finishPendingDeletes();
    const loadedSettings = await loadSettings();
    const budgetRappen = await ensureMonthBudget(monthPrefix, loadedSettings.defaultBudgetRappen);
    // Promise.all startet die unabhängigen Abfragen gleichzeitig und wartet,
    // bis alle fertig sind. Das ist schneller als eine nach der anderen.
    const [loadedExpenses, monthTotalRappen, dailyTotals, history, pending] = await Promise.all([
      listExpenses(),
      getMonthTotalRappen(monthPrefix),
      getDailyTotalsRappen(monthPrefix, daysInMonth),
      listMonthBudgets(),
      getPendingDelete(),
    ]);

    // Ergebnisse in den State schreiben -> die Screens zeigen die neuen Zahlen
    setExpenses(loadedExpenses);
    setSettings(loadedSettings);
    setSummary({ monthTotalRappen, dailyTotals, budgetRappen, month: monthPrefix });
    setBudgetHistory(history);
    setPendingDelete(pending);
    if (pending) {
      setSnackbar({
        id: `undo-${pending.id}-${pending.deadline}`,
        message: 'Ausgabe gelöscht', icon: 'trash-2', actionLabel: 'Rückgängig',
        expiresAt: pending.deadline,
        onAction: async () => {
          try {
            const restored = await restoreExpense(pending);
            await refreshData();
            if (!restored) setSnackbar({ id: Date.now(), message: 'Die Rückgängig-Frist ist abgelaufen.', icon: 'info' });
          } catch (error) {
            console.warn('Ausgabe konnte nicht wiederhergestellt werden:', error);
            Alert.alert('Nicht wiederhergestellt', 'Die Ausgabe konnte nicht zurückgeholt werden.');
          }
        },
      });
    }

  }, []);

  // Erster Start und "Erneut versuchen" nach einem Fehler
  const load = useCallback(async () => {
    setStatus('loading');
    try {
      await refresh();
      setStatus('ready');
    } catch (error) {
      console.warn('Daten konnten nicht geladen werden:', error);
      setStatus('error');
    }
  }, [refresh]);

  // Der erste Datenbankaufruf ist asynchron; der Ladezustand steht bereits fest.
  useEffect(() => {
    refresh().then(() => setStatus('ready')).catch((error) => {
      console.warn('Daten konnten nicht geladen werden:', error);
      setStatus('error');
    });
  }, [refresh]);

  // Wer die App über Nacht offen lässt, soll am nächsten Morgen die Zahlen
  // vom neuen Tag (bzw. neuen Monat) sehen. Darum beim Zurückkommen aus dem
  // Hintergrund neu lesen.
  useEffect(() => {
    // Letzter bekannter Zustand der App ('active', 'background' …)
    let previousState = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (previousState !== 'active' && nextState === 'active') {
        refresh().catch((error) => {
          console.warn('Daten konnten nicht aktualisiert werden:', error);
        });
      }
      previousState = nextState;
    });
    return () => subscription.remove();
  }, [refresh]);

  // --- Aktionen ---------------------------------------------------------
  // Alle Aktionen schreiben zuerst in die Datenbank und lesen danach neu.
  // So zeigt die App nie etwas an, was nicht wirklich gespeichert ist.

  // Neue Ausgabe speichern (Formular «Neue Ausgabe»)
  const createExpense = useCallback(
    async (input) => {
      const expense = await addExpense(input);
      await refresh();
      return expense;
    },
    [refresh]
  );

  // Bestehende Ausgabe ändern (Formular «Ausgabe bearbeiten»)
  const editExpense = useCallback(
    async (id, input) => {
      await updateExpense(id, input);
      await refresh();
    },
    [refresh]
  );

  // Die id sorgt dafür, dass bei einer neuen Meldung auch die 5 Sekunden
  // wieder von vorne laufen.
  const showSnackbar = useCallback((config) => setSnackbar({ ...config, id: Date.now() }), []);
  const hideSnackbar = useCallback(() => setSnackbar(null), []);

  // Löschen mit Sicherheitsnetz: Die Zeile bleibt bis zur Frist in SQLite
  // und lässt sich über die Snackbar 5 Sekunden lang zurückholen.
  // Wird im Verlauf (Wischen) und im Bearbeiten-Modal verwendet.
  const removeExpense = useCallback(
    async (expense) => {
      await deleteExpense(expense.id);
      await refresh();
    },
    [refresh]
  );

  useEffect(() => {
    if (!pendingDelete) return undefined;
    const remaining = Math.max(0, pendingDelete.deadline - Date.now());
    const timer = setTimeout(() => {
      finishPendingDeletes().catch((error) => console.warn('Löschen wird beim nächsten Start abgeschlossen:', error));
    }, remaining);
    return () => clearTimeout(timer);
  }, [pendingDelete]);

  const updateMonthBudget = useCallback(async (month, amountRappen, useForFuture) => {
    await saveMonthBudget(month, amountRappen, useForFuture);
    await refresh();
  }, [refresh]);

  // Eine Einstellung speichern, z. B. updateSetting('appearance', 'dark')
  const updateSetting = useCallback(
    async (key, value) => {
      await saveSetting(key, value);
      // Sofort im Bildschirm nachführen, damit der Schalter nicht nachhinkt
      setSettings((current) => ({ ...current, [key]: value }));
    },
    []
  );

  // "Alle Daten löschen": Ausgaben, Einstellungen und Code
  const deleteAllData = useCallback(async () => {
    // Ein offenes "Rückgängig" würde sonst eine Ausgabe zurückholen
    setSnackbar(null);
    setPendingDelete(null);
    const db = await getDatabase();
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync('DELETE FROM expenses');
      await transaction.runAsync('DELETE FROM monthly_budgets');
      await transaction.runAsync('DELETE FROM settings');
    });
    await clearPin();
    await refresh();
  }, [refresh]);

  // Nur im Entwicklungsmodus: Demo-Daten für die Präsentation
  const loadDemoData = useCallback(
    async (demoExpenses) => {
      await addManyExpenses(demoExpenses);
      await refresh();
    },
    [refresh]
  );

  // Alles, was die Screens über useData() bekommen. useMemo stellt das Objekt
  // nur neu zusammen, wenn sich einer der Werte in der Liste unten ändert.
  const value = useMemo(
    () => ({
      status,
      retry: load,
      expenses,
      settings,
      // Abkürzungen, damit die Screens nicht so tief suchen müssen
      budgetRappen: summary.budgetRappen,
      currentMonth: summary.month,
      budgetHistory,
      updateMonthBudget,
      spentRappen: summary.monthTotalRappen,
      dailyTotals: summary.dailyTotals,
      createExpense,
      editExpense,
      removeExpense,
      updateSetting,
      deleteAllData,
      loadDemoData,
      snackbar,
      showSnackbar,
      hideSnackbar,
    }),
    [
      status,
      load,
      expenses,
      settings,
      summary,
      budgetHistory,
      updateMonthBudget,
      createExpense,
      editExpense,
      removeExpense,
      updateSetting,
      deleteAllData,
      loadDemoData,
      snackbar,
      showSnackbar,
      hideSnackbar,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// Hook für die Screens: const { expenses, budgetRappen } = useData();
export function useData() {
  const data = useContext(DataContext);
  // Ohne DataProvider gibt es keine Daten – dann lieber eine klare Fehlermeldung
  if (!data) {
    throw new Error('useData muss innerhalb von <DataProvider> verwendet werden.');
  }
  return data;
}
