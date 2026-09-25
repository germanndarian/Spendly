# Testkonzept Spendly

## Testumgebung

| | |
| --- | --- |
| Gerät | iPhone 17 Pro Simulator, iOS 26.5 |
| App | Expo Go, Expo SDK 57, Entwicklungsmodus |
| Datum | 25.09.2026 |
| Testdaten | Code `111111`, Monatsbudget CHF 800.00, «Demo-Daten laden» (Ausgaben der letzten 30 Tage) |

Face ID läuft in Expo Go auf dem iPhone nicht (Einschränkung von Expo). Die Fälle mit echter Biometrie
(T05, T06) müssen darum auf einem Android-Gerät mit Expo Go oder mit einem Development Build getestet werden.

**Ergebnis:** OK = wie erwartet · Offen = noch nicht durchgeführt

## Automatische Tests (Unit-Tests)

Die reinen Funktionen in `utils/` werden mit jest-expo getestet (`npm test`).

| ID | Datei | Was geprüft wird | Ergebnis |
| --- | --- | --- | --- |
| U01 | `format.test.js` | Schweizer Betragsformat `CHF 1'240.50`, Eingabe mit Komma und Punkt, Rappen ohne Rundungsfehler, Datumstexte («Heute», «Gestern», «Montag, 21. Sept.») | OK |
| U02 | `budget.test.js` | «Heute noch frei» wie im Mockup (CHF 24.50), Abrunden, Budget überschritten, «Auf Kurs», Schaltjahr, Budget 0 | OK |
| U03 | `validation.test.js` | Betrag (Pflicht, > 0, max. 2 Nachkommastellen), Kategorie, Beschreibung max. 40 Zeichen, Datum nicht in der Zukunft, Monatsbudget | OK |
| U04 | `expenseList.test.js` | Sortierung, Suche in Beschreibung und Kategorie, Kategorie-Filter, Gruppierung nach Tag mit Tagessumme, Uhrzeit nur bei am selben Tag erfassten Ausgaben | OK |
| U05 | `autoLock.test.js` | Sperrzeit: «Sofort», «Nach 1 Minute» (59 s ok, 60 s sperrt), «Nach 5 Minuten», «Nie» | OK |

Stand 25.09.2026: 5 Testdateien, 65 Tests, alle bestanden.

## Manuelle Tests

### Entsperren und Sicherheit

| ID | Schritt | Erwartet | Ergebnis |
| --- | --- | --- | --- |
| T01 | App zum ersten Mal öffnen, 6-stelligen Code zweimal eingeben | «Code festlegen», danach «Code bestätigen», dann erscheint die Übersicht | OK |
| T02 | Gesperrte App: falschen Code eingeben | Rote Meldung «Falscher Code. Versuche es nochmals.» mit Icon, Punkte werden geleert, Zahlenblock bleibt an derselben Stelle | OK |
| T03 | Gesperrte App: richtigen Code eingeben | Übersicht erscheint | OK |
| T04 | App in Expo Go auf dem iPhone öffnen | Kein Absturz. Hinweis «Face ID ist in Expo Go nicht erlaubt …» und direkt die Code-Eingabe | OK |
| T05 | Android / Development Build: «Mit Fingerabdruck/Face ID entsperren» antippen und erfolgreich scannen | Übersicht erscheint | Offen |
| T06 | Android / Development Build: Biometrie 3-mal fehlschlagen lassen | Nach Fehlversuch 1 und 2 «Erneut versuchen», nach dem 3. automatisch Code-Eingabe mit Hinweis | Offen |
| T07 | Sperrzeit «Nach 1 Minute»: entsperrte App länger als 60 Sekunden in den Hintergrund legen, dann wieder öffnen | App ist gesperrt, Code-Eingabe erscheint (getestet mit 66 s) | OK |
| T07b | Einstellungen → «Automatisch sperren» → «Sofort», App 3 Sekunden in den Hintergrund legen | Beim Zurückkommen gesperrt. Auswahl ist gespeichert und in der Zeile sichtbar («Sofort») | OK |
| T08 | Einstellungen → «App jetzt sperren» | Sofort Code-Eingabe, kein Weg zurück ohne Code | OK |
| T09 | Einstellungen → «Code ändern», falschen aktuellen Code eingeben | Meldung «Falscher Code», Schritt bleibt «Aktueller Code» | OK |
| T10 | Einstellungen → «Code ändern», richtigen aktuellen Code eingeben | Weiter zu «Neuen Code wählen» | OK |
| T11 | Einstellungen, Face ID nicht verfügbar (Expo Go) | Schalter aus und deaktiviert, Hinweis unter der Gruppe | OK |
| T12 | Code-Eingabe → «Code vergessen?» → «Alle Daten löschen» | Alle Daten weg, App startet mit «Code festlegen» | OK |

### Ausgaben erfassen, bearbeiten, löschen

| ID | Schritt | Erwartet | Ergebnis |
| --- | --- | --- | --- |
| T13 | «+» antippen, Betrag `0` eingeben | Meldung «Betrag muss grösser als CHF 0.00 sein.» und «Bitte eine Kategorie wählen.», je mit Icon, «Ausgabe speichern» gesperrt | OK |
| T14 | Betrag `0,5` (mit Komma), Kategorie «Essen & Trinken», Beschreibung «Migros», speichern | Modal schliesst, Snackbar «Gespeichert», Übersicht zeigt CHF 0.50 und neues «Heute noch frei» | OK |
| T15 | Nochmals «+» antippen | Zuletzt gewählte Kategorie ist vorausgewählt | OK |
| T16 | Ausgabe in der Liste antippen | «Ausgabe bearbeiten» mit Betrag, Kategorie, Beschreibung und Datum vorausgefüllt | OK |
| T17 | Im Bearbeiten «Ausgabe löschen» antippen | Modal schliesst, Ausgabe weg, Snackbar «Ausgabe gelöscht · Rückgängig» | OK |
| T18 | Verlauf: Zeile nach links wischen, «Löschen» antippen | Ausgabe weg, Anzahl und Tagessumme angepasst, Snackbar 5 Sekunden sichtbar | OK |
| T19 | Direkt danach «Rückgängig» antippen | Ausgabe ist wieder da (gleiche id in der Datenbank) | OK |

### Übersicht und Verlauf

| ID | Schritt | Erwartet | Ergebnis |
| --- | --- | --- | --- |
| T20 | Übersicht ohne Ausgaben | Karte «Noch keine Ausgaben im September» mit Tipp «Tippe auf +», nicht vom «+»-Button verdeckt | OK |
| T20b | Übersicht und Verlauf mit heute erfassten Ausgaben | Zweite Zeile mit Uhrzeit: Übersicht «Essen & Trinken · Heute, 09:52», Verlauf «Essen & Trinken · 09:52» | OK |
| T20c | Übersicht, Budget CHF 2'000.00, ausgegeben CHF 1'489.90 | Karte «Sparziel September – Du hast diesen Monat CHF 510.10 Reserve.» Bei überschrittenem Budget ist die Karte ausgeblendet | OK |
| T21 | Übersicht mit Demo-Daten (CHF 560.70 von 800.00, 25. Sept.) | «Heute noch frei» CHF 39.88 (= 239.30 / 6 Tage), 70 %, rote Punkte über Tagen über dem Tagesbudget | OK |
| T22 | Ausgabe über CHF 300 erfassen, sodass das Budget überschritten ist | «Budget überschritten um CHF 60.70» rot mit Warn-Icon, Balken rot, 108 % | OK |
| T23 | Übersicht → «Alle anzeigen» | Wechsel in den Tab «Verlauf» | OK |
| T24 | Verlauf: nach «Zalando» suchen | «Keine Ausgaben für «Zalando» gefunden» mit Button «Filter zurücksetzen», Untertitel «0 Treffer» | OK |
| T25 | «Filter zurücksetzen» antippen | Suche leer, alle Ausgaben sichtbar | OK |

### Einstellungen und Darstellung

| ID | Schritt | Erwartet | Ergebnis |
| --- | --- | --- | --- |
| T26 | «Monatsbudget» antippen, `800.000` eingeben | Meldung «Höchstens 2 Nachkommastellen.», «Speichern» gesperrt | OK |
| T27 | Budget-Dialog mit «Abbrechen» schliessen | Budget bleibt CHF 800.00 | OK |
| T28 | Darstellung «Dunkel» wählen | Alle Screens, Dialoge und die Tab-Leiste werden dunkel, Wahl wird gespeichert | OK |
| T29 | «Alle Daten löschen» antippen | Bestätigungsdialog nennt die Anzahl («33 Ausgaben, deine Einstellungen und dein Code …») | OK |
| T30 | Im Dialog «Abbrechen» | Alle Daten bleiben erhalten | OK |
| T31 | «Demo-Daten laden» (nur Entwicklungsmodus) | 40 Ausgaben der letzten 30 Tage, keine in der Zukunft, Snackbar «40 Demo-Ausgaben geladen» | OK |

### Fehlerfälle und Barrierefreiheit

| ID | Schritt | Erwartet | Ergebnis |
| --- | --- | --- | --- |
| T32 | Datenbank kann nicht geöffnet werden | Meldung «Daten konnten nicht geladen werden» mit «Erneut versuchen», kein Absturz | Offen |
| T33 | VoiceOver / TalkBack einschalten und alle Screens durchgehen | Alle Buttons sind beschriftet, Ausgaben lassen sich über die Aktion «Löschen» ohne Wischen löschen | Offen |
