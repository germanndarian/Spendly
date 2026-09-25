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
  // Kurze Rückmeldung am unteren Rand (z. B. nach dem Löschen).
  // Sie steht hier, damit sie auch nach dem Schliessen eines Modals sichtbar ist.
  const [snackbar, setSnackbar] = useState(null);

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

  // Wer die App über Nacht offen lässt, soll am nächsten Morgen die Zahlen
  // vom neuen Tag (bzw. neuen Monat) sehen. Darum beim Zurückkommen aus dem
  // Hintergrund neu lesen.
  useEffect(() => {
    let previousState = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (previousState === 'background' && nextState === 'active') {
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

  // Die id sorgt dafür, dass bei einer neuen Meldung auch die 5 Sekunden
  // wieder von vorne laufen.
  const showSnackbar = useCallback((config) => setSnackbar({ ...config, id: Date.now() }), []);
  const hideSnackbar = useCallback(() => setSnackbar(null), []);

  // Löschen mit Sicherheitsnetz: Die gelöschte Ausgabe bleibt hier im
  // Speicher und lässt sich über die Snackbar 5 Sekunden lang zurückholen.
  // Wird im Verlauf (Wischen) und im Bearbeiten-Modal verwendet.
  const removeExpense = useCallback(
    async (expense) => {
      await deleteExpense(expense.id);
      await refresh();
      showSnackbar({
        message: 'Ausgabe gelöscht',
        icon: 'trash-2',
        actionLabel: 'Rückgängig',
        onAction: async () => {
          try {
            // Mit gleicher id zurückschreiben – als wäre nichts passiert
            await restoreExpense(expense);
            await refresh();
          } catch (error) {
            console.warn('Ausgabe konnte nicht wiederhergestellt werden:', error);
            Alert.alert('Nicht wiederhergestellt', 'Die Ausgabe konnte nicht zurückgeholt werden.');
          }
        },
      });
    },
    [refresh, showSnackbar]
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
    // Ein offenes "Rückgängig" würde sonst eine Ausgabe zurückholen
    setSnackbar(null);
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
  if (!data) {
    throw new Error('useData muss innerhalb von <DataProvider> verwendet werden.');
  }
  return data;
}
