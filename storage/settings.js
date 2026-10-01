// Einstellungen als Schlüssel-Wert-Paare in der Tabelle "settings".
// Alles steht als Text in der Datenbank und wird hier wieder in den
// richtigen Typ umgewandelt (Zahl, true/false, Text).
import { getDatabase } from './db';

// Schlüssel und Standardwerte an einem Ort.
export const DEFAULT_SETTINGS = {
  defaultBudgetRappen: null, // optionale Vorgabe für neue Monate
  biometricEnabled: true, // Face ID / Fingerabdruck verwenden
  autoLockMinutes: 1, // Sperrzeit im Hintergrund in Minuten, null = nie
  appearance: 'system', // 'light' | 'dark' | 'system'
  lastCategory: null, // zuletzt gewählte Kategorie (Vorauswahl)
  hintSeen: false, // Tipp im Leerzustand schon gesehen?
};

// Wie der gespeicherte Text wieder gelesen wird.
const PARSERS = {
  defaultBudgetRappen: (value) => (value === '' ? null : Number(value)),
  biometricEnabled: (value) => value === 'true',
  autoLockMinutes: (value) => (value === '' ? null : Number(value)),
  appearance: (value) => value,
  lastCategory: (value) => (value === '' ? null : value),
  hintSeen: (value) => value === 'true',
};

// Alle Einstellungen lesen. Fehlende Schlüssel bekommen den Standardwert.
export async function loadSettings() {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT key, value FROM settings');

  // Mit den Standardwerten starten und dann mit den gespeicherten Werten überschreiben
  const settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    const parse = PARSERS[row.key];
    // Unbekannte Schlüssel (z. B. aus einer älteren Version) ignorieren
    if (parse) {
      settings[row.key] = parse(row.value);
    }
  }
  return settings;
}

// Eine Einstellung speichern. "INSERT ... ON CONFLICT" legt den Schlüssel an
// oder überschreibt ihn, je nachdem ob er schon existiert.
export async function saveSetting(key, value) {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    // Alles als Text speichern. null bzw. undefined wird zu '' (leerer Text).
    String(value ?? '')
  );
}

// Für "Alle Daten löschen": zurück auf die Standardwerte.
export async function resetSettings() {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM settings');
}
