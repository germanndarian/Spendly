// Einstiegspunkt der App: lädt die Schriften und baut die "Hüllen" auf,
// die alle Screens brauchen (Safe Area, Daten, Farbschema, Navigation).
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Schriften: Inter für normalen Text, Newsreader (Serife) für grosse Beträge
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Newsreader_400Regular, Newsreader_700Bold } from '@expo-google-fonts/newsreader';
// Unsere eigenen Bausteine: Daten, Farbschema und Navigation
import { DataProvider } from './storage/DataContext';
import { ThemeProvider } from './theme/ThemeContext';
import RootNavigator from './navigation/RootNavigator';

// Splash-Screen stehen lassen, bis die Schriften geladen sind
SplashScreen.preventAutoHideAsync();

// Die Haupt-Komponente. Alles, was man in der App sieht, liegt darin.
export default function App() {
  // useFonts lädt die Schriftdateien. fontsLoaded wird true, sobald alle da sind.
  // fontError ist gesetzt, wenn beim Laden etwas schiefgeht.
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Newsreader_400Regular,
    Newsreader_700Bold,
  });

  // useEffect läuft, nachdem React etwas angezeigt hat. Hier: Sobald die
  // Schriften bereit sind (oder ein Fehler kam), den Splash-Screen ausblenden.
  useEffect(() => {
    // Auch bei einem Fehler weitermachen – dann mit der Systemschrift
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Noch nicht fertig geladen: nichts anzeigen, der Splash-Screen bleibt sichtbar.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Reihenfolge ist wichtig: Das Farbschema steht in der Datenbank,
  // deshalb liegt der DataProvider aussen.
  // Die Hüllen von aussen nach innen:
  // - SafeAreaProvider: kennt die Ränder (Notch, Home-Leiste) für SafeAreaView
  // - DataProvider: lädt die Daten aus der Datenbank und gibt sie weiter
  // - ThemeProvider: wählt die Farben (hell oder dunkel)
  // - RootNavigator: zeigt den richtigen Screen an
  return (
    <SafeAreaProvider>
      <DataProvider>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </DataProvider>
    </SafeAreaProvider>
  );
}
