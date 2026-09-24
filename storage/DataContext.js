// Stellt allen Screens die gespeicherten Daten zur Verfügung:
// Ausgaben, Monatsbudget und Einstellungen.
// Die Screens sprechen nie direkt mit der Datenbank, sondern nur über diesen Hook.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getDaysInMonth } from '../utils/budget';
import { toISODate } from '../utils/format';
import {
  addExpense,
  addManyExpenses,
  deleteAllExpenses,
  deleteExpense,
  getDailyTotalsRappen,
  getMonthTotalRappen,
  listExpenses,
  restoreExpense,
  updateExpense,
} from './expenses';
import { DEFAULT_SETTINGS, loadSettings, resetSettings, saveSetting } from './settings';
import { clearPin } from './pin';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  // 'loading' beim Start, 'error' wenn die Datenbank nicht antwortet
  const [status, setStatus] = useState('loading');
  const [expenses, setExpenses] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  // Summen für die Übersicht – die rechnet SQLite direkt aus
  const [summary, setSummary] = useState({ monthTotalRappen: 0, dailyTotals: [] });

  // Alles neu aus der Datenbank lesen (ohne Ladeanzeige).
  const refresh = useCallback(async () => {
    const today = new Date();
    const monthPrefix = toISODate(today).slice(0, 7); // '2026-09'
    const daysInMonth = getDaysInMonth(today);

    const [loadedExpenses, loadedSettings, monthTotalRappen, dailyTotals] = await Promise.all([
      listExpenses(),
      loadSettings(),
      getMonthTotalRappen(monthPrefix),
      getDailyTotalsRappen(monthPrefix, daysInMonth),
    ]);

    setExpenses(loadedExpenses);
    setSettings(loadedSettings);
    setSummary({ monthTotalRappen, dailyTotals });
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

  useEffect(() => {
    load();
  }, [load]);

  // --- Aktionen ---------------------------------------------------------
  // Alle Aktionen schreiben zuerst in die Datenbank und lesen danach neu.
  // So zeigt die App nie etwas an, was nicht wirklich gespeichert ist.

  const createExpense = useCallback(
    async (input) => {
      const expense = await addExpense(input);
      // Kategorie merken, damit sie beim nächsten Mal vorausgewählt ist
      await saveSetting('lastCategory', input.category);
      await refresh();
      return expense;
    },
    [refresh]
  );

  const editExpense = useCallback(
    async (id, input) => {
      await updateExpense(id, input);
      await saveSetting('lastCategory', input.category);
      await refresh();
    },
    [refresh]
  );

  const removeExpense = useCallback(
    async (id) => {
      await deleteExpense(id);
      await refresh();
    },
    [refresh]
  );

  // "Rückgängig" nach dem Löschen
  const undoRemove = useCallback(
    async (expense) => {
      await restoreExpense(expense);
      await refresh();
    },
    [refresh]
  );

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
    await deleteAllExpenses();
    await resetSettings();
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

  const value = useMemo(
    () => ({
      status,
      retry: load,
      expenses,
      settings,
      budgetRappen: settings.budgetRappen,
      spentRappen: summary.monthTotalRappen,
      dailyTotals: summary.dailyTotals,
      createExpense,
      editExpense,
      removeExpense,
      undoRemove,
      updateSetting,
      deleteAllData,
      loadDemoData,
    }),
    [
      status,
      load,
      expenses,
      settings,
      summary,
      createExpense,
      editExpense,
      removeExpense,
      undoRemove,
      updateSetting,
      deleteAllData,
      loadDemoData,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// Hook für die Screens: const { expenses, budgetRappen } = useData();
export function useData() {
  const data = useContext(DataContext);
  if (!data) {
    throw new Error('useData muss innerhalb von <DataProvider> verwendet werden.');
  }
  return data;
}
