// Stellt allen Screens das aktuelle Farbschema zur Verfügung.
// Einstellung "Erscheinungsbild": 'light' (Hell), 'dark' (Dunkel) oder 'system'.
// Die Auswahl steht in der Datenbank und gilt darum auch nach einem Neustart.
import { createContext, useCallback, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useData } from '../storage/DataContext';
import { darkColors, lightColors } from './colors';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Farbschema des Handys ('light' oder 'dark')
  const systemScheme = useColorScheme();
  const { settings, updateSetting } = useData();
  const mode = settings.appearance;

  const setMode = useCallback(
    (nextMode) => {
      updateSetting('appearance', nextMode).catch((error) => {
        console.warn('Erscheinungsbild konnte nicht gespeichert werden:', error);
      });
    },
    [updateSetting]
  );

  const value = useMemo(() => {
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
  if (!theme) {
    throw new Error('useTheme muss innerhalb von <ThemeProvider> verwendet werden.');
  }
  return theme;
}
