# Spendly – Sprechertext

Darian Germann und Alex Platret · 1. Oktober 2026

Zielzeit: 8 Minuten 55 Sekunden, einschliesslich 2 Minuten Live-Demo. Die Folien enthalten diesen Text auch als PowerPoint-Notizen. Darian übernimmt Folien 1–4 und 9–10, Alex Folien 5–8. Die Aufteilung kann vor dem Üben angepasst werden.

## 1. Spendly · 0:20

Darian: Wir zeigen Spendly, unsere Ausgaben-App für Lernende und Studierende. Sie sammelt kleine tägliche Ausgaben und zeigt, was vom Monatsbudget übrig bleibt. Wir vergleichen zuerst die Idee mit der fertigen App und zeigen danach die wichtigsten Funktionen direkt am Gerät.

## 2. Ausgaben im Alltag · 0:45

Darian: Unsere Zielgruppe sind Lernende und Studierende in der Schweiz. Wer den ersten Lohn erhält, bezahlt vieles mit Karte, TWINT oder Bargeld. Einzelne Beträge wirken klein. Zusammen belasten sie das Budget. Unsere Aufgabe war deshalb eine einfache, lokale App: Betrag und Kategorie erfassen, den verbleibenden Betrag sehen und einen Eintrag später korrigieren. Die 14 Franken 80 sind unser Beispiel aus dem Konzept. Es gibt kein Benutzerkonto und keine Bankverbindung. Ein kurzer Weg durch die App war ein Designziel. Die geplanten zehn Sekunden für eine Erfassung sind noch keine gemessene Leistung.

## 3. Konzept und Design · 0:50

Darian: Links sehen wir das LB1-Mockup, rechts die aktuelle App. Der verfügbare Betrag bleibt im Vordergrund. Waldgrün, ein warmer Hintergrund und die Serifenschrift bei Beträgen bilden die Identität von Spendly. Übersicht, Verlauf und Einstellungen sind direkt erreichbar. Die Entwicklung verlief in Schritten: zuerst Oberfläche und Navigation, dann Speicherung und Biometrie, danach Fehlerfälle und Tests. Das zeigt auch die Historie im Repository. Für LB3 haben wir den Stand nochmals mit dem Konzept abgeglichen. Die App ergänzt native Bedienung und Dark Mode. Beide Bilder verwenden unterschiedliche Beispieldaten. Sie zeigen den Designvergleich, keinen Zahlenvergleich.

## 4. Live-Demo · 2:00

Darian zeigt die App, Alex erklärt kurz die Ergebnisse.

0:00–0:15: App entsperren. Face ID nur zeigen, wenn der Test am Präsentationsgerät erfolgreich war. Sonst den eingerichteten App-Code verwenden.
0:15–0:40: Neue Ausgabe erfassen: CHF 14.80, Kategorie Essen & Trinken, Beschreibung «Mittagessen», heutiges Datum. Speichern.
0:40–0:55: Auf der Übersicht zeigen, dass Restbudget und Tagesbetrag sinken. Der Tagesbetrag verteilt das restliche Budget auf die restlichen Kalendertage inklusive heute.
0:55–1:15: Im Verlauf «Mittagessen» suchen. Den Betrag auf CHF 12.80 ändern und speichern.
1:15–1:35: Den Eintrag löschen und mit «Rückgängig» wiederherstellen.
1:35–2:00: App vollständig schliessen und neu öffnen. Erneut entsperren und denselben Eintrag im Verlauf zeigen. So wird die lokale Speicherung sichtbar.

Falls die Vorführung stockt: nach spätestens 15 Sekunden auf die mitgelieferte Aufnahme wechseln. Keine ungetestete Biometrie als erfolgreiche Demonstration ankündigen. Beispieldaten vor dem Vortrag einmal vorbereiten, nach dem Durchlauf wiederherstellen.

## 5. Biometrische App-Sperre · 0:55

Alex: Die App-Sperre ist unser Smartphone-Feature. Anschaulich ist das Betriebssystem der Türsteher. Spendly fragt, ob die Person das Gerät entsperren darf. Das Gerät prüft Gesicht oder Fingerabdruck, und die App erhält Erfolg oder einen Fehler. Spendly bekommt kein Foto und keinen Fingerabdruck. Wer Biometrie nicht verwenden kann, nutzt einen eigenen sechsstelligen Code. Dessen Prüfwert liegt zusammen mit einem zufälligen Salz in SecureStore. Nach fünf falschen Versuchen folgen 30 Sekunden Wartezeit. Weitere Fehler verlängern die Wartezeit bis auf fünf Minuten. Ein Neustart setzt diese Sperre nicht zurück. Die App-Sperre schützt den Zugang innerhalb der App. Die SQLite-Datei ist dadurch nicht zusätzlich verschlüsselt. Der native Systemdialog und die erfolgreiche Erkennung wurden im Simulator geprüft. Das physische iPhone war für Xcode nicht erreichbar. Ein echter Gesichtsscan ist deshalb noch nicht nachgewiesen.

## 6. Der Weg einer Ausgabe · 0:55

Alex: Die App trennt Bedienung, Berechnungen und Speicherung. Das Formular prüft zuerst den Betrag und die übrigen Felder. Nur gültige Eingaben gehen an den gemeinsamen DataContext. Dieser ruft die Speicherfunktionen auf. In SQLite steht jede Ausgabe als Datensatz mit ID, Betrag, Kategorie, Beschreibung und Datum. Geld speichern wir als ganze Rappen. 14 Franken 80 sind die ganze Zahl 1480. Das verhindert typische Ungenauigkeiten mit Dezimalzahlen. Danach aktualisiert der Context die Daten, und die Übersicht berechnet das Budget neu. Reine Funktionen lassen sich unabhängig von der Oberfläche testen. Kommentare erklären etwa die Rappenrechnung und gebundene SQL-Parameter.

## 7. Konzept und Umsetzung · 0:50

Alex: Das finale Konzept war unsere Ausgangsbasis. Die lokale SQLite-Datenbank und ganze Rappen entsprechen bereits der Planung aus LB1. Monatsbudgets bleiben getrennt. Ein Standardbudget gilt für neue Monate. Auch die fünf Sekunden lange Löschfrist liegt dauerhaft in SQLite. Dark Mode erweitert den Mindestumfang. Eine Abweichung bleibt beim Code-Prüfwert: Die App nutzt SHA-256 mit Salt und SecureStore, keine spezielle langsame Passwortableitung. Das ist bewusst als Vereinfachung dokumentiert. Zusätzliche Funktionen wie Cloud-Synchronisierung oder Bankimport bleiben ausserhalb des Projekts. Der genaue Vergleich und die Abweichungen stehen in der technischen Dokumentation.

## 8. Qualität und Tests · 0:45

Alex: Der aktuelle Prüflauf umfasst 91 bestandene automatisierte Tests. Neun Testsuiten prüfen unter anderem Berechnungen, Validierung, Code-Sperren und die SQLite-Speicherung. Die Datenbanktests nutzen eine echte SQLite-Engine. Zwei Tests prüfen den tatsächlichen Ablauf bei vergessenem Code mit aktivierter und deaktivierter Biometrie. ESLint ist ebenfalls ohne Fehler durchgelaufen. Zusätzlich prüfen wir die App als Ablauf: erstellen, verändern, löschen, zurückholen und nach einem Neustart wiederfinden. Der vollständige Ablauf funktionierte im eigenen iOS-Release-Build im Simulator, auch nach dem Stoppen des Entwicklungsservers. Historische Budgets und dunkle Darstellung wurden zusätzlich geprüft. Der native Face-ID-Systemdialog konnte mit einer simulierten passenden Erkennung entsperren. Der physische Gesichtsscan bleibt offen. Ein Unit-Test beweist keinen erfolgreichen Face-ID-Vorgang. Deshalb unterscheiden wir diese Nachweise. Einen Nutzertest mit der Zielgruppe und eine gemessene Erfassungszeit haben wir noch nicht durchgeführt.

## 9. Herausforderungen · 0:50

Darian: Zwei Stellen zeigen, warum eine fertige App mehr braucht als den normalen Erfolgsfall. Ein einzelner globaler Budgetwert würde alte Monate beim Ändern verfälschen. Deshalb speichert die App Monatswerte getrennt und hält das Standardbudget zusätzlich fest. Auch ein Neustart darf die Sperrzeit nach falschen Codes nicht zurücksetzen. Dafür speichert SecureStore die Fehlversuche und den Sperrzeitpunkt. Beim Schliessen eines veränderten Formulars fragt die App vor dem Verwerfen nach. Die Folgerung ist für uns technisch klar: Jede wichtige Aktion braucht einen definierten Zustand vor der Änderung, ein Ergebnis bei Erfolg und eine verständliche Reaktion bei einem Fehler. Sonst können Oberfläche und gespeicherte Daten auseinanderlaufen.

## 10. Rückblick und Ausblick · 0:45

Darian: Spendly setzt die Kernidee aus LB1 um: tägliche Ausgaben erfassen und das verfügbare Monatsbudget verständlich zeigen. Die wichtigste technische Lehre ist, Fehlerfälle früher genauso konkret zu planen wie den normalen Ablauf. Dazu gehören falsche Codes, abgebrochene Formulare und ein Neustart während einer Aktion. Als Nächstes würden wir die App mit Lernenden testen. Verstehen sie den Tagesbetrag? Finden sie die Korrektur eines Eintrags? Und gelingt die Erfassung tatsächlich in der geplanten kurzen Zeit? Erst mit diesen Beobachtungen lässt sich die Bedienung gezielt weiterentwickeln. Damit sind wir am Ende und beantworten gerne Fragen.
