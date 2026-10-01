# Spendly LB3 · Prüfprotokoll

Prüfdatum: 1. Oktober 2026. Autoren: Darian Germann und Alex Platret.

## Umgebung und Nachweise

- Expo 57.0.26, React Native 0.86.3, React 19.2.3; Node.js 25.9 für die automatisierten Tests.
- iPhone 17 Pro Simulator mit iOS 26.5. Zuerst Expo Go, danach der eigene iOS-Release-Build mit eingebettetem JavaScript-Bundle.
- Xcode 27.0: Release-Builds für iOS-Simulator und physisches iPhone erfolgreich. Die Signatur des iPhone-Builds wurde mit `codesign --verify --deep --strict` geprüft.
- Demo-Code der eingerichteten Testinstanzen: **111111**. Die Einrichtung im eigenen Build wurde durch den Benutzer abgeschlossen. Der Code ist nicht im Programm fest eingebaut.
- Die 40 Ausgaben aus `data/demoData.js` wurden in Expo Go geladen. Nur die SQLite-Datenbank mit diesen Beispieldaten wurde zur Vorbereitung in die native Testinstanz übernommen. Danach erfolgten Erstellung, Änderung, Löschung, Rückgängig und Neustart über die App.
- Die Screenshots in `docs/readme` zeigen den tatsächlich laufenden eigenen Release-Build. Die Abgabe enthält zusätzlich `Spendly_LB3_Demo.mp4` mit 2:06 Minuten, ohne Ton. Die Aufnahme zeigt den tatsächlichen Simulatorablauf; sie ersetzt keinen physischen Gerätetest.

## Automatisierte Prüfungen

| Prüfung | Ergebnis | Aussage |
| :-- | :-- | :-- |
| `npm test -- --runInBand` | 91/91 Tests in 9 Testdateien bestanden | 65 bestehende Regeln, 6 PIN-, 9 SQLite-, 9 Biometrie- und 2 Sperrbildschirmfälle |
| `npm run lint` | Bestanden | Keine ESLint-Fehler |
| `git diff --check` | Bestanden | Keine Fehler bei Leerzeichen oder Konfliktmarkierungen |
| SQLite-Integration | 9 Tests bestanden | Echtes SQL über `node:sqlite`: Migration, Monatsbudgets, Transaktionen, Rollback und persistente Löschfrist |
| Biometrie und Wiederherstellung | Regeln und Dialoge bestanden | Systemantworten sind simuliert; insbesondere darf deaktivierte Biometrie keinen Daten erhaltenden PIN-Reset anbieten |

Die SQLite-Testanbindung bildet die verwendeten Expo-Methoden nach. Sie prüft die SQL-Logik mit einer echten Speicherdatenbank, jedoch nicht die Gerätesensoren. Der zusätzliche native Simulatorlauf prüft das dort verwendete native Modul.

## Beobachtete Bedienabläufe

| Fall | Beobachtung | Ergebnis |
| :-- | :-- | :-- |
| Erstes Budget | Ohne Budget erscheint «Budget festlegen». CHF 800 für Oktober mit Übernahme als Vorgabe gespeichert. | Bestanden in Expo Go |
| Ungültige Ausgabe | Betrag 0 zeigt «Betrag muss grösser als CHF 0.00 sein.»; Speichern bleibt deaktiviert. | Bestanden in Expo Go und eigenem Release-Build |
| Erstellen | «Mittagessen», Essen & Trinken, CHF 14.80, 1. Oktober: Monatssumme steigt von CHF 7.60 auf CHF 22.40; Tagesbudget sinkt von CHF 25.56 auf CHF 25.08. | Bestanden in beiden Varianten |
| Suchen und ändern | Suche «Mittagessen» zeigt einen Treffer. Änderung auf CHF 12.80 bleibt in Verlauf und Übersicht sichtbar. | Bestanden in beiden Varianten |
| Löschen und Rückgängig | Die zugängliche Löschaktion der Zeile entfernt den Suchtreffer; «Rückgängig» stellt denselben Eintrag mit CHF 12.80 innerhalb der Frist wieder her. | Bestanden in beiden Varianten |
| Ungesicherte Änderung | CHF 12.80 auf CHF 99 geändert und «Abbrechen» gewählt: Bestätigungsdialog erscheint. Nach «Verwerfen» und Neustart bleibt CHF 12.80 gespeichert. | Bestanden in Expo Go |
| Vollständiger Neustart | Prozess beendet und erneut gestartet: zuerst gesperrt. PIN 111111 öffnet die gespeicherten Ausgaben. Oktober: CHF 20.40 von CHF 800, Tagesbudget CHF 25.14. | Bestanden in beiden Varianten |
| Betrieb ohne Metro | Entwicklungsserver gestoppt. Im eigenen Release-Build trotzdem erstellt, geändert, gelöscht, rückgängig gemacht und nach vollständigem Neustart wiedergefunden. | Bestanden; Aufnahme liegt bei |
| Monatsbudgets | September separat auf CHF 900 gesetzt und erneut geöffnet: CHF 723.40 ausgegeben, CHF 176.60 Rest. Oktober bleibt bei CHF 800; die Vorgabe bleibt CHF 800. | Bestanden im eigenen Release-Build |
| Darstellung | «Dunkel» gewählt: dunkle Darstellung sichtbar. Danach «System» wiederhergestellt. | Bestanden im eigenen Release-Build |
| Native Face ID | Simulator-Verfahren «Enrolled», nativer Systemdialog, dann «Matching Face»: Spendly öffnet die Übersicht. | Bestanden mit simuliertem Gesicht |
| Physisches iPhone | Signierter Release-Build und Signaturprüfung erfolgreich. Xcode meldet das gekoppelte iPhone als nicht erreichbar. | Installation und echter Gesichtsscan offen |

Die Löschprüfung verwendete die bereitgestellte Accessibility-Aktion und das Formular. Ein tatsächlicher Swipe mit dem Finger wurde in diesem Durchgang nicht separat gemessen. Gespeicherte PIN-Sperrfristen und die Frist nach einer Löschung sind durch die automatisierten Regressionen geprüft; damit wird kein vollständiger manueller Durchgang aller Fehlerfälle behauptet.

## Grenzen und weitere Prüfungen

Kein vollständiger neuer Android-, VoiceOver- oder TalkBack-Durchlauf und keine Messung der Erfassungszeit mit Personen der Zielgruppe. Ein Simulator-Erfolg ist kein Nachweis für einen echten Face-ID-Scan. Die SQLite-Datenbank ist nicht zusätzlich verschlüsselt; der gesalzene SHA-256-Prüfwert ist keine langsame Passwortableitung. Diese Grenzen sind auch in der technischen Dokumentation und im Konzeptvergleich genannt.
