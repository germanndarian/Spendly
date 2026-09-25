// Stellt allen Screens das aktuelle Farbschema zur Verfügung.
// Einstellung "Erscheinungsbild": 'light' (Hell), 'dark' (Dunkel) oder 'system'.
// Die Auswahl steht in der Datenbank und gilt darum auch nach einem Neustart.
import { createContext, useCallback, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useData } from '../storage/DataContext';
import { darkColors, lightColors } from './colors';

// Ein Context ist wie ein gemeinsamer Speicher: Jede Komponente darunter
// kann die Werte lesen, ohne dass man sie über Props weiterreichen muss.
const ThemeContext = createContext(null);

// Der Provider umschliesst die App (siehe App.js) und liefert die Farben.
// children = alles, was zwischen <ThemeProvider> und </ThemeProvider> steht.
export function ThemeProvider({ children }) {
  // Farbschema des Handys ('light' oder 'dark')
  const systemScheme = useColorScheme();
  const { settings, updateSetting } = useData();
  // Gewählte Einstellung: 'light', 'dark' oder 'system'
  const mode = settings.appearance;

  // Neues Erscheinungsbild speichern. useCallback sorgt dafür, dass die
  // Funktion nicht bei jedem Neuzeichnen neu erstellt wird.
  const setMode = useCallback(
    (nextMode) => {
      updateSetting('appearance', nextMode).catch((error) => {
        console.warn('Erscheinungsbild konnte nicht gespeichert werden:', error);
      });
    },
    [updateSetting]
  );

  // useMemo rechnet den Wert nur neu, wenn sich mode oder das
  // Farbschema des Handys ändert – nicht bei jedem Neuzeichnen.
  const value = useMemo(() => {
    // Dunkel, wenn 'dark' gewählt ist – oder 'system' und das Handy ist dunkel
    const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
    return {
      colors: isDark ? darkColors : lightColors,
      isDark,
      mode,
      setMode,
    };
  }, [mode, systemScheme, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Hook für Komponenten: const { colors, isDark } = useTheme();
export function useTheme() {
  const theme = useContext(ThemeContext);
  // Ohne Provider gibt es keine Farben – dann lieber eine klare Fehlermeldung
  if (!theme) {
    throw new Error('useTheme muss innerhalb von <ThemeProvider> verwendet werden.');
  }
  return theme;
}
