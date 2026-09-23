// Stellt allen Screens das aktuelle Farbschema zur Verfügung.
// Einstellung "Erscheinungsbild": 'light' (Hell), 'dark' (Dunkel) oder 'system'.
import { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors } from './colors';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Farbschema des Handys ('light' oder 'dark')
  const systemScheme = useColorScheme();
  // Auswahl der Person – wird in Phase 4 in den Einstellungen gespeichert
  const [mode, setMode] = useState('system');

  const value = useMemo(() => {
    const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
    return {
      colors: isDark ? darkColors : lightColors,
      isDark,
      mode,
      setMode,
    };
  }, [mode, systemScheme]);

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
