# Spendly

Spendly ist eine Ausgaben-App für iOS und Android, gebaut mit React Native und Expo.
Junge Erwachsene erfassen damit ihre täglichen Ausgaben in wenigen Sekunden und sehen jederzeit,
**wie viel sie heute noch ausgeben dürfen**, ohne ihr Monatsbudget zu sprengen.

Die App wurde im **Modul 335 «Mobile-Applikation realisieren»** (LB1) von zwei ICT-Lernenden entwickelt.
Alle Daten bleiben lokal auf dem Gerät. Es braucht weder ein Konto noch Internet.

## Funktionen

| Screen | Was man dort macht |
| --- | --- |
| **Entsperren** (Startscreen) | Face ID bzw. Fingerabdruck, eigener 6-stelliger Code als Ersatz. Beim ersten Start wird der Code festgelegt. |
| **Übersicht** | «Heute noch frei» (Tagesbudget), Fortschritt im Monat, Monatsstreifen mit einem Balken pro Tag, die letzten 3 Ausgaben. |
| **Neue Ausgabe** (Modal) | Betrag, Kategorie, Beschreibung und Datum erfassen, mit Prüfung in Echtzeit. Dasselbe Formular dient zum Bearbeiten und Löschen. |
| **Verlauf** | Alle Ausgaben nach Tag gruppiert, mit Suche und Kategorie-Filter. Nach links wischen löscht, «Rückgängig» holt die Ausgabe 5 Sekunden lang zurück. |
| **Einstellungen** | Monatsbudget, Face ID an/aus, Sperrzeit (Sofort / 1 Minute / 5 Minuten / Nie), Code ändern, App sperren, Hell/Dunkel/System, alle Daten löschen. |

**Special Feature:** Biometrie mit `expo-local-authentication`. Nach der eingestellten Sperrzeit im Hintergrund
(Standard: 1 Minute) sperrt sich die App automatisch wieder.

## Technik

- **Expo SDK 57**, React Native 0.86, nur **JavaScript** (kein TypeScript)
- **React Navigation 7**: Root-Stack (Entsperren → Tabs → Modal) und Bottom-Tabs
- **expo-sqlite** für Ausgaben und Einstellungen, **expo-secure-store** für den Code-Hash
- **expo-local-authentication** (Face ID / Fingerabdruck), **expo-crypto** (SHA-256, Salz, UUIDs)
- **expo-haptics** (Rückmeldung beim Speichern), **@react-native-community/datetimepicker**
- Schriften **Inter** und **Newsreader** über `@expo-google-fonts`, Icons von **Feather** (`@expo/vector-icons`)
- Nur Core-Komponenten und `StyleSheet.create`, keine UI-Bibliothek
- Tests mit **jest-expo**

## App starten

Voraussetzung: Node.js und die App **Expo Go** auf dem Handy.

```bash
npm install
npx expo start
```

Danach den QR-Code mit der Kamera (iOS) bzw. mit Expo Go (Android) scannen.

> **Hinweis zu Face ID:** Expo Go unterstützt Face ID auf dem iPhone nicht. Spendly erkennt das und
> zeigt direkt die Code-Eingabe mit einem Hinweis. Auf Android funktioniert der Fingerabdruck auch in Expo Go.
> Um Face ID auf dem iPhone zu testen, braucht es einen Development Build (`npx expo run:ios`).

**Demo-Daten:** Im Entwicklungsmodus gibt es in den Einstellungen den Punkt «Demo-Daten laden».
Er erzeugt rund 40 typische Ausgaben der letzten 30 Tage (Migros, SBB, Kino …).

## Tests und Prüfungen

```bash
npm test               # Unit-Tests der Hilfsfunktionen in utils/
npx expo lint          # Code-Stil (ESLint)
npx expo-doctor        # prüft Abhängigkeiten und Konfiguration
```

Die Unit-Tests liegen in `utils/__tests__/`. Die manuellen Tests und ihre Ergebnisse stehen im
[Testkonzept](TESTKONZEPT.md).

## Projektstruktur

```
App.js                Schriften laden, Provider (Safe Area, Daten, Farben), Navigation
navigation/           RootNavigator (Stack + automatische Sperre), MainTabs, navigationRef
screens/              LockScreen, OverviewScreen, NewExpenseScreen, HistoryScreen, SettingsScreen
components/           kleine, wiederverwendbare Bausteine (Button, Chip, ExpenseRow, Snackbar …)
storage/              ALLER Zugriff auf SQLite und SecureStore (db, expenses, settings, pin, DataContext)
utils/                reine Funktionen: Formatierung, Budget, Validierung, Listen (+ Unit-Tests),
                      biometrics.js kapselt expo-local-authentication
theme/                Farben (hell/dunkel), Schriften, Abstände, ThemeContext
data/demoData.js      Demo-Ausgaben für die Präsentation
design/               Mockups als PNG
```

Die Screens greifen nie direkt auf die Datenbank zu, sondern nur über `useData()` aus
`storage/DataContext.js`. So bleibt jeder Screen kurz und die SQL-Befehle stehen an einem Ort.

## Datenhaltung

| Daten | Speicherort | Warum |
| --- | --- | --- |
| Ausgaben (`id`, `amount_rappen`, `category`, `description`, `date`, `created_at`) | SQLite, Tabelle `expenses` (Index auf `date`) | Kern der App |
| Monatsbudget, Face ID an/aus, Sperrzeit, Erscheinungsbild, zuletzt gewählte Kategorie, «Hinweis gesehen» | SQLite, Tabelle `settings` (Schlüssel/Wert) | Man soll nicht bei jedem Start neu einstellen müssen |
| App-Code | expo-secure-store (`spendly_pin_hash`) | Nur als gesalzener SHA-256-Hash, nie im Klartext |

- **Beträge in Rappen:** Alle Beträge sind ganze Zahlen (CHF 12.50 = 1250). So entstehen keine Rundungsfehler wie bei `0.1 + 0.2`.
- **Summen in SQL:** Monatssumme und Tagessummen für den Monatsstreifen rechnet SQLite mit `SUM` und `GROUP BY` aus.
- **Schema-Version** in `PRAGMA user_version`, damit spätere Änderungen bestehende Daten nicht zerstören.
- **Bewusst nicht gespeichert:** Gesichts- und Fingerabdruckdaten (die sieht die App nie), der Entsperrt-Status
  (nach einem Neustart ist die App immer gesperrt), Suchbegriff und Filter.

## Gestaltung

Das Design folgt dem Design-System aus `DESIGN.md`: warmes Off-White, Tinte und ein dunkles Waldgrün als
einzige Akzentfarbe. Rot erscheint nur bei Budgetüberschreitung, Fehlern und beim Löschen und immer
zusammen mit Icon und Text. Beträge stehen in Newsreader mit tabellarischen Ziffern im Schweizer Format
(`CHF 1'240.50`). Jedes tippbare Element ist mindestens 48 pt hoch, alle Icon-Buttons haben eine
Beschriftung für den Screenreader, und es gibt einen Dark Mode.
