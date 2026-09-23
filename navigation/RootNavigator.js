// Oberste Navigation der App (Root-Stack):
// 1. Lock        – Startscreen "Entsperren"
// 2. Main        – die drei Tabs (Übersicht, Verlauf, Einstellungen)
// 3. NewExpense  – Formular als Modal (neu erfassen und bearbeiten)
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../theme/ThemeContext';
import { navigationRef } from './navigationRef';
import MainTabs from './MainTabs';
import LockScreen from '../screens/LockScreen';
import NewExpenseScreen from '../screens/NewExpenseScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { colors, isDark } = useTheme();

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
    </NavigationContainer>
  );
}
