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
  const [summary, setSummary] = useState({ monthTotalRappen: 0, dailyTotals: [] });
  // Kurze Rückmeldung am unteren Rand (z. B. nach dem Löschen).
  // Sie steht hier, damit sie auch nach dem Schliessen eines Modals sichtbar ist.
  const [snackbar, setSnackbar] = useState(null);

  // Liest alles aus der Datenbank, ändert aber noch nichts am State.
  const fetchAll = useCallback(async () => {
    const today = new Date();
    const monthPrefix = toISODate(today).slice(0, 7); // '2026-09'
    const daysInMonth = getDaysInMonth(today);

    // Promise.all startet alle vier Abfragen gleichzeitig und wartet,
    // bis alle fertig sind. Das ist schneller als eine nach der anderen.
    const [loadedExpenses, loadedSettings, monthTotalRappen, dailyTotals] = await Promise.all([
      listExpenses(),
      loadSettings(),
      getMonthTotalRappen(monthPrefix),
      getDailyTotalsRappen(monthPrefix, daysInMonth),
    ]);
    return { loadedExpenses, loadedSettings, monthTotalRappen, dailyTotals };
  }, []);

  // Schreibt die gelesenen Daten in den State -> die Screens zeigen die neuen Zahlen
  const applyData = useCallback(({ loadedExpenses, loadedSettings, monthTotalRappen, dailyTotals }) => {
    setExpenses(loadedExpenses);
    setSettings(loadedSettings);
    setSummary({ monthTotalRappen, dailyTotals });
  }, []);

  // Alles neu aus der Datenbank lesen (ohne Ladeanzeige).
  const refresh = useCallback(async () => {
    applyData(await fetchAll());
  }, [fetchAll, applyData]);

  // Zählt, wie oft «Erneut versuchen» getippt wurde. Ändert sich die Zahl,
  // läuft der Effekt unten noch einmal und lädt alles neu.
  const [loadAttempt, setLoadAttempt] = useState(0);

  // Beim Start der App (und nach jedem «Erneut versuchen») alles laden.
  // Der Status steht beim Start schon auf 'loading'. Gesetzt wird er erst,
  // wenn die Datenbank geantwortet hat (in .then bzw. .catch):
  // 'ready' bei Erfolg, 'error' wenn die Datenbank nicht antwortet.
  useEffect(() => {
    fetchAll()
      .then((data) => {
        applyData(data);
        setStatus('ready');
      })
      .catch((error) => {
        console.warn('Daten konnten nicht geladen werden:', error);
        setStatus('error');
      });
    // loadAttempt steht hier nur, damit der Effekt bei jedem neuen Versuch läuft
  }, [fetchAll, applyData, loadAttempt]);

  // «Erneut versuchen» nach einem Fehler: Ladeanzeige zeigen und neu laden
  const retry = useCallback(() => {
    setStatus('loading');
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  // Wer die App über Nacht offen lässt, soll am nächsten Morgen die Zahlen
  // vom neuen Tag (bzw. neuen Monat) sehen. Darum beim Zurückkommen aus dem
  // Hintergrund neu lesen.
  useEffect(() => {
    // Letzter bekannter Zustand der App ('active', 'background' …)
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

  // Neue Ausgabe speichern (Formular «Neue Ausgabe»)
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

  // Bestehende Ausgabe ändern (Formular «Ausgabe bearbeiten»)
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

  // Eine Einstellung speichern, z. B. updateSetting('budgetRappen', 90000)
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

  // Alles, was die Screens über useData() bekommen. useMemo stellt das Objekt
  // nur neu zusammen, wenn sich einer der Werte in der Liste unten ändert.
  const value = useMemo(
    () => ({
      status,
      retry,
      expenses,
      settings,
      // Abkürzungen, damit die Screens nicht so tief suchen müssen
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
      retry,
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
  // Ohne DataProvider gibt es keine Daten – dann lieber eine klare Fehlermeldung
  if (!data) {
    throw new Error('useData muss innerhalb von <DataProvider> verwendet werden.');
  }
  return data;
}
