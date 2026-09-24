// Einstellungen als Schlüssel-Wert-Paare in der Tabelle "settings".
// Alles steht als Text in der Datenbank und wird hier wieder in den
// richtigen Typ umgewandelt (Zahl, true/false, Text).
import { getDatabase } from './db';

// Schlüssel und Standardwerte an einem Ort.
export const DEFAULT_SETTINGS = {
  budgetRappen: 80000, // CHF 800.00
  biometricEnabled: true, // Face ID / Fingerabdruck verwenden
  autoLockEnabled: true, // nach 1 Minute im Hintergrund sperren
  appearance: 'system', // 'light' | 'dark' | 'system'
  lastCategory: null, // zuletzt gewählte Kategorie (Vorauswahl)
  hintSeen: false, // Tipp im Leerzustand schon gesehen?
};

// Wie der gespeicherte Text wieder gelesen wird.
const PARSERS = {
  budgetRappen: (value) => Number(value),
  biometricEnabled: (value) => value === 'true',
  autoLockEnabled: (value) => value === 'true',
  appearance: (value) => value,
  lastCategory: (value) => (value === '' ? null : value),
  hintSeen: (value) => value === 'true',
};

// Alle Einstellungen lesen. Fehlende Schlüssel bekommen den Standardwert.
export async function loadSettings() {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT key, value FROM settings');

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
    String(value ?? '')
  );
}

// Für "Alle Daten löschen": zurück auf die Standardwerte.
export async function resetSettings() {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM settings');
}
