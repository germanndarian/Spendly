# Spendly – Sprechertext

Darian Germann und Alex Platret · 1. Oktober 2026

Zielzeit: 8 Minuten 55 Sekunden, einschliesslich 2 Minuten Live-Demo. Die Folien enthalten diesen Text auch als PowerPoint-Notizen. Darian übernimmt Folien 1–3, 6 und 9–10. Alex übernimmt Folien 4–5 und 7–8. Darian bedient die App während der Demo auf Folie 4. Die Aufteilung kann vor dem Üben angepasst werden.

## 1. Die Frage zum Einstieg · 0:35

Darian: Wie entscheidet ihr, was ihr euch heute noch leisten könnt?

[Die Frage wirken lassen. Etwa fünf Sekunden warten, dann ein bis zwei kurze Antworten aufnehmen. Keine privaten Beträge verlangen.]

Vielleicht schaut ihr auf den Kontostand. Vielleicht überschlagt ihr es im Kopf. Genau bei dieser Entscheidung beginnt unser Projekt. Wir wollten wissen: Wie können wir kleine Ausgaben so sichtbar machen, dass das restliche Monatsbudget verständlich bleibt?

## 2. Kleine Ausgaben summieren sich · 0:40

Darian: Ein Kaffee für vier Franken fünfzig. Ein Mittagessen für zwölf Franken achtzig. Ein Musikabo für dreizehn Franken fünfundneunzig. Jede Zahlung ist für sich überschaubar. Zusammen sind es bereits einunddreissig Franken fünfundzwanzig. Das ist ein Beispiel, keine Statistik über unsere Zielgruppe. Gerade beim ersten eigenen Lohn oder einem festen Monatsbudget hilft es, diese Beträge zusammen zu sehen. Unsere Aufgabe aus LB1 war deshalb klar: eine einfache App für Lernende und Studierende, die Ausgaben in Franken erfasst und das verbleibende Budget zeigt.

## 3. Spendly · 0:45

Darian: Das ist Spendly. Auf der Übersicht steht die Frage aus dem Einstieg jetzt als konkrete Zahl: Was bleibt für heute? Im gezeigten Beispiel sind es fünfundzwanzig Franken vierzehn. Spendly verteilt das restliche Monatsbudget auf die verbleibenden Kalendertage, einschliesslich heute. Diese Zahl ist eine Orientierung und reagiert auf neue Ausgaben. Betrag und Kategorie reichen für einen Eintrag. Im Verlauf könnt ihr eine Ausgabe wiederfinden und korrigieren. Ein eigenes Budget pro Monat hält ältere Werte getrennt. Für den Einstieg braucht es kein Konto und keine Verbindung zu einer Bank. Die Daten liegen auf dem Gerät. Wir zeigen euch jetzt, wie sich das im Alltag anfühlt.

## 4. Spendly im Alltag · 2:00

Alex erklärt, Darian bedient die App. Bei der Aufnahme erklären beide die sichtbaren Schritte.

Alex: Stellt euch vor, ihr kommt gerade vom Mittagessen. Wir erfassen jetzt genau diese Ausgabe.

0:00–0:15: Spendly entsperren. Den Demo-PIN 111111 verwenden. Face ID nur als Live-Scan zeigen, wenn es am Präsentationsgerät erfolgreich geprüft wurde.
0:15–0:40: CHF 14.80, Essen & Trinken, «Mittagessen», heutiges Datum eingeben und speichern.
0:40–0:55: Alex: Der Eintrag ist gespeichert. Gleichzeitig verändert sich die Tagesorientierung. Wir sehen direkt, was vom Monatsbudget bleibt.
0:55–1:15: Im Verlauf «Mittagessen» suchen. CHF 14.80 auf CHF 12.80 ändern und speichern.
1:15–1:35: Den Eintrag löschen und innerhalb der fünf Sekunden «Rückgängig» wählen.
1:35–2:00: App vollständig beenden und neu öffnen. Mit PIN 111111 entsperren und den erhaltenen Eintrag zeigen. Alex: Die Ausgabe bleibt auch nach einem Neustart erhalten.

Wenn die Live-Demo nach 15 Sekunden nicht läuft, auf das beigefügte Video wechseln. Die Aufnahme dauert 2:06 und hat keinen Ton. Mit Video verlängert sich die Zielzeit von 8:55 auf etwa 9:01. Vor einer neuen Live-Demo den Beispieldatensatz prüfen, damit nicht bereits ein zweiter identischer Mittagessen-Eintrag besteht.

## 5. Deine Ausgaben bleiben bei dir · 0:55

Alex: Ausgaben können persönlich sein. Spendly speichert sie lokal, ohne Konto und ohne eigenen Server. Die App-Sperre nutzt eine Funktion des Smartphones. Stellt euch das Betriebssystem als Türsteher vor: Spendly fragt, ob die Person das Gerät entsperren darf. Das Gerät prüft Gesicht oder Fingerabdruck. Die App erhält nur das Ergebnis, kein Foto und keinen Fingerabdruck. Als Alternative gibt es einen eigenen sechsstelligen Code. Nach fünf falschen Versuchen wartet die App dreissig Sekunden. Weitere Fehler verlängern diese Zeit, und ein Neustart setzt sie nicht zurück. Die Grenze ist klar: Die App-Sperre verschlüsselt die SQLite-Datei nicht zusätzlich. Der native Face-ID-Dialog funktioniert im Simulator. Ein echter Scan bleibt offen, weil Xcode unser physisches iPhone nicht erreichen konnte.

## 6. Vom Entwurf zur nutzbaren App · 0:45

Darian: Rechts läuft die App, links steht der ursprüngliche Entwurf. Der Betrag ist in beiden der Mittelpunkt. Die Kategorie ist direkt erreichbar. Grün, der warme Hintergrund und die Schrift bei den Beträgen bleiben Teil des Designs. Wir haben zuerst Oberfläche und Navigation umgesetzt. Danach kamen Speicherung und Gerätesperre. Anschliessend haben wir Fehlerfälle und Tests ergänzt. Für LB3 verglichen wir den Code nochmals mit dem Konzept. Getrennte Monatsbudgets und dauerhafte Fristen haben wir vervollständigt. Dark Mode erweitert den geplanten Umfang. Dabei war eine Erkenntnis entscheidend: Die App braucht auch bei einer falschen Eingabe oder einer abgebrochenen Aktion einen klaren Zustand.

## 7. Die Technik hinter Spendly · 0:50

Alex: Hinter dem kurzen Ablauf steckt eine getrennte Struktur. Das Formular prüft die Eingabe. Der gemeinsame DataContext führt die Aktion aus. SQLite speichert sie, danach aktualisieren sich die Ansichten. Die Methoden und Kommentare erklären diese Aufgaben im Code. Geld liegt als ganze Rappen in der Datenbank. Aus vierzehn Franken achtzig wird die Zahl eintausendvierhundertachtzig. Beim Monatsbudget behalten wir für jeden Monat einen eigenen Wert. Beim Löschen speichern wir die fünf Sekunden lange Frist, damit ein Neustart sie nicht verändert. Beides entspricht dem Konzept. Eine Abweichung bleibt beim Code-Prüfwert: SHA-256 mit zufälligem Salt in SecureStore ist einfacher als die geplante langsame Passwortableitung. Diese Grenze haben wir dokumentiert.

## 8. Der Kern funktioniert · 0:45

Alex: Wir können den Kern heute zeigen. Einundneunzig automatisierte Tests in neun Suiten bestehen. Sie prüfen Berechnungen, Eingaben, PIN-Sperren und die Speicherung. Die SQLite-Regressionen führen echtes SQL aus. ESLint meldet keine Fehler. Zusätzlich haben wir den vollständigen Ablauf im eigenen iOS-Release-Build geprüft: erfassen, korrigieren, löschen, zurückholen und nach einem vollständigen Neustart wiederfinden. Dabei war der Entwicklungsserver gestoppt. Auch alte Monatsbudgets und Dark Mode wurden geprüft. Das ist technischer Nachweis. Ob Lernende Spendly täglich nutzen und die Tagesorientierung verstehen, müssen wir als Nächstes mit ihnen testen. Ein erfolgreicher Simulator-Dialog ersetzt auch keinen echten Gesichtsscan.

## 9. Rückblick und Ausblick · 0:55

Darian: Unser Rückblick ist konkret: Ein Monatsbudget braucht eine feste Zuordnung zum Monat. Sonst verändert ein neuer Wert auch die Vergangenheit. Auch die Rückgängig-Frist und die PIN-Sperre müssen einen Neustart überstehen. Das waren Herausforderungen, für die wir dauerhafte Zustände speichern mussten. Beim nächsten Projekt würden wir solche Fehlerfälle früher im Entwurf planen. Im Ausblick könnten wir Spendly um einen CSV-Export für Ausgaben oder Statistiken nach Kategorien erweitern. Diese Funktionen sind Ideen für spätere Versionen und noch nicht umgesetzt. Zuerst würden wir mit Lernenden prüfen, ob sie die Tagesorientierung verstehen und welche Erweiterung ihnen hilft. Die offenen Geräte- und Barrierefreiheitstests bleiben ebenfalls wichtig.

## 10. Spendly ausprobieren · 0:45

Darian: Am Anfang haben wir gefragt, wie ihr entscheidet, was ihr euch heute noch leisten könnt. Spendly macht eure erfassten Ausgaben und das restliche Monatsbudget sichtbar. Wir haben aus dem Entwurf eine funktionierende App gemacht und die wichtigsten Abläufe geprüft. Jetzt seid ihr dran: Wollt ihr Spendly ausprobieren? Welche Funktion würdet ihr euch für euren Alltag wünschen? Eure Ideen würden uns helfen, die nächste Version gezielt zu verbessern.

[Die Einladung kurz wirken lassen und in die Fragerunde überleiten.]

Vielen Dank. Wir beantworten gerne eure Fragen zur Idee, zur App und zur technischen Umsetzung.
