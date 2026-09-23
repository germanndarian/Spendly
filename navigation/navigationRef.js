// Referenz auf den NavigationContainer. Damit können wir auch ausserhalb
// eines Screens navigieren, z. B. beim automatischen Sperren (Phase 3).
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

// Sperrt die App: Der ganze Stack wird ersetzt, danach existiert nur noch
// der Lock-Screen. Es gibt also keinen "Zurück"-Weg in die App.
export function lockApp() {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: 'Lock' }] });
  }
}
