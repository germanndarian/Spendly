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

const Stack = createNativeStackNavigator();

// Merkt sich, wann die App in den Hintergrund gewechselt ist, und sperrt
// beim Zurückkommen, wenn das länger als die Sperrzeit her ist.
function useAutoLock(minutes) {
  useEffect(() => {
    // "Nie": gar nicht erst zuhören
    if (minutes === null) return undefined;

    let backgroundSince = null;

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

    return () => subscription.remove();
  }, [minutes]);
}

export default function RootNavigator() {
  const { colors, isDark } = useTheme();
  const { status, retry, settings, snackbar, hideSnackbar } = useData();

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
      <Stack.Navigator initialRouteName="Lock" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Lock" component={LockScreen} />
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
