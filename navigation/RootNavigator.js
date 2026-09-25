// Oberste Navigation der App (Root-Stack):
// 1. Lock        – Startscreen "Entsperren"
// 2. Main        – die drei Tabs (Übersicht, Verlauf, Einstellungen)
// 3. NewExpense  – Formular als Modal (neu erfassen und bearbeiten)
//
// Hier liegt auch die automatische Sperre: Wer die App länger als die
// eingestellte Sperrzeit im Hintergrund hat, landet wieder auf "Lock".
import { useEffect } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../theme/ThemeContext';
import { useData } from '../storage/DataContext';
import EmptyState from '../components/EmptyState';
import Snackbar from '../components/Snackbar';
import { shouldAutoLock } from '../utils/autoLock';
import { lockApp, navigationRef } from './navigationRef';
import MainTabs from './MainTabs';
import LockScreen from '../screens/LockScreen';
import NewExpenseScreen from '../screens/NewExpenseScreen';

// Erzeugt die Bausteine für den Stack. Die Screens liegen darin übereinander
// wie ein Kartenstapel: Der oberste ist sichtbar.
const Stack = createNativeStackNavigator();

// Merkt sich, wann die App in den Hintergrund gewechselt ist, und sperrt
// beim Zurückkommen, wenn das länger als die Sperrzeit her ist.
function useAutoLock(minutes) {
  useEffect(() => {
    // "Nie": gar nicht erst zuhören
    if (minutes === null) return undefined;

    // Zeitpunkt, seit dem die App im Hintergrund ist (null = die App ist offen)
    let backgroundSince = null;

    // AppState meldet jede Änderung: 'active' (offen), 'background' (weg),
    // 'inactive' (kurz unterbrochen, z. B. Kontrollzentrum)
    const subscription = AppState.addEventListener('change', (state) => {
      // Nur 'background' zählt. 'inactive' meldet iOS auch, während der
      // Face-ID-Dialog offen ist – mit "Sofort" würde man sich sonst
      // direkt nach dem Entsperren wieder aussperren.
      if (state === 'background' && backgroundSince === null) {
        backgroundSince = Date.now();
      } else if (state === 'active') {
        if (shouldAutoLock(backgroundSince, Date.now(), minutes)) {
          lockApp();
        }
        backgroundSince = null;
      }
    });

    // Aufräumen: Ändert sich die Sperrzeit, wird der alte Zuhörer entfernt
    return () => subscription.remove();
  }, [minutes]);
}

// Die oberste Navigation. Sie entscheidet, welcher Screen sichtbar ist.
export default function RootNavigator() {
  const { colors, isDark } = useTheme();
  // Aus dem DataContext: Ladezustand, Einstellungen und die aktuelle Snackbar
  const { status, retry, settings, snackbar, hideSnackbar } = useData();

  // Automatische Sperre mit der eingestellten Sperrzeit einschalten
  useAutoLock(settings.autoLockMinutes);

  // Unsere Farben an React Navigation weitergeben, damit Hintergründe
  // beim Wechseln der Screens nicht weiss aufblitzen.
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };

  // Solange die Datenbank lädt bzw. wenn sie nicht antwortet,
  // zeigen wir statt der Navigation eine kurze Rückmeldung.
  if (status !== 'ready') {
    // NavigationContainer verwaltet, welche Screens offen sind. Über ref kann
    // auch Code ausserhalb eines Screens navigieren (z. B. die Auto-Sperre).
    return (
      <View style={[styles.fallback, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {status === 'loading' ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <EmptyState
            icon="alert-triangle"
            tone="danger"
            title="Daten konnten nicht geladen werden"
            description="Die Datenbank auf diesem Gerät hat nicht geantwortet."
            actionLabel="Erneut versuchen"
            onAction={retry}
          />
        )}
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* Start immer auf "Lock". headerShown: false = jeder Screen zeichnet
         seine Kopfzeile selbst, statt die Standard-Leiste zu verwenden. */}
      <Stack.Navigator initialRouteName="Lock" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Lock" component={LockScreen} />
        {/* Die Tabs blenden nach dem Entsperren weich ein (fade) */}
        <Stack.Screen name="Main" component={MainTabs} options={{ animation: 'fade' }} />
        <Stack.Screen
          name="NewExpense"
          component={NewExpenseScreen}
          // iOS: Blatt von unten, schliesst mit Wischen nach unten
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>

      {/* Liegt über allen Screens, damit die Meldung auch nach dem
          Schliessen des Modals noch sichtbar ist */}
      <Snackbar
        // Neuer key = React baut die Snackbar neu, die 5 Sekunden beginnen von vorn
        key={snackbar?.id}
        visible={snackbar !== null}
        message={snackbar?.message}
        icon={snackbar?.icon}
        actionLabel={snackbar?.actionLabel}
        onAction={snackbar?.onAction}
        onHide={hideSnackbar}
      />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
