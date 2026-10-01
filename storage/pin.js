// Der 6-stellige App-Code.
// Der Code wird NIE im Klartext gespeichert: Wir legen nur einen Hash
// (SHA-256 mit zufälligem Salz) in expo-secure-store ab. Fehlversuche und
// Sperrfrist liegen zusammen mit dem Hash im geschützten Speicher.
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'spendly_pin_hash';
export const PIN_LENGTH = 6;
// Nach so vielen falschen Codes beginnt die Wartezeit
export const MAX_PIN_ATTEMPTS = 5;

// Nach dem fünften Fehler 30 Sekunden, danach 60, 120, 240 und maximal 300.
// Ein Neustart oder das Schliessen eines Dialogs setzt die Fehler nicht zurück.
export function nextFailedAttempt(record, now = Date.now()) {
  // Einen Fehlversuch mehr zählen
  const failedAttempts = (record.failedAttempts ?? 0) + 1;
  // Wartezeit in Sekunden: 0 vor dem 5. Fehler, danach 30, 60, 120, 240 und höchstens 300
  const delay = failedAttempts < MAX_PIN_ATTEMPTS ? 0 : Math.min(300, 30 * 2 ** Math.min(4, failedAttempts - MAX_PIN_ATTEMPTS));
  return { ...record, failedAttempts, lockedUntil: delay ? now + delay * 1000 : 0 };
}

// Liest den gespeicherten Eintrag (Hash, Salz, Fehlversuche, Sperrfrist) aus dem SecureStore
async function readPin() {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  if (!stored) return null;
  // Bestehende Installationen verwendeten «salz:hash». Beim ersten Versuch
  // wird dieser Eintrag verlustfrei ins neue Format mit Sperrfrist übernommen.
  if (!stored.startsWith('{')) {
    const [salt, digest] = stored.split(':');
    return { version: 1, algorithm: 'SHA256', salt, digest, failedAttempts: 0, lockedUntil: 0 };
  }
  return JSON.parse(stored);
}

// Wie viele Fehlversuche gab es, und bis wann ist die Code-Eingabe gesperrt?
export async function getPinStatus() {
  const record = await readPin();
  return { failedAttempts: record?.failedAttempts ?? 0, lockedUntil: record?.lockedUntil ?? 0 };
}

// Zufälliges Salz (16 Bytes) als Hex-Text.
// Das Salz sorgt dafür, dass gleiche Codes trotzdem verschiedene Hashes geben.
async function createSalt() {
  // 16 zufällige Bytes vom Betriebssystem
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes)
    // Jedes Byte als zwei Hex-Zeichen, z. B. 10 -> '0a'
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function hashCode(code, salt) {
  // SHA-256 macht aus «Salz:Code» eine lange Zeichenkette (den Hash).
  // Dies ist keine langsame Passwortableitung: Die Sperrfrist schützt die
  // Eingabe in der App; SecureStore schützt den gespeicherten Eintrag.
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${code}`);
}

// Gibt es schon einen Code? (Beim allerersten Start: nein)
export async function hasPin() {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  return stored !== null;
}

// Code festlegen oder ändern. Ein JSON-Eintrag enthält Hash, Salz und Sperrstatus.
export async function setPin(code) {
  // Schutz: Nur genau sechs Ziffern sind ein gültiger Code
  if (!/^\d{6}$/.test(code)) throw new Error('Der Code muss sechs Ziffern enthalten.');
  const salt = await createSalt();
  const digest = await hashCode(code, salt);
  await SecureStore.setItemAsync(PIN_KEY, JSON.stringify({ version: 1, algorithm: 'SHA256', salt, digest, failedAttempts: 0, lockedUntil: 0 }));
}

// Eingegebenen Code prüfen: gleich salzen, gleich hashen, vergleichen.
async function checkPin(code) {
  const stored = await readPin();
  // Noch kein Code festgelegt -> kann auch nicht stimmen
  if (!stored) return { valid: false, failedAttempts: 0, lockedUntil: 0 };
  // Noch gesperrt: Der Code wird gar nicht erst geprüft
  if (stored.lockedUntil > Date.now()) return { valid: false, failedAttempts: stored.failedAttempts, lockedUntil: stored.lockedUntil };

  // Erst nach Ablauf der Sperrfrist wird ein weiterer Hash berechnet.
  const candidate = await hashCode(code, stored.salt);
  const valid = candidate === stored.digest;
  // Richtig: Fehlversuche zurücksetzen. Falsch: Fehlversuch zählen und eventuell sperren.
  const next = valid ? { ...stored, failedAttempts: 0, lockedUntil: 0 } : nextFailedAttempt(stored);
  await SecureStore.setItemAsync(PIN_KEY, JSON.stringify(next));
  return { valid, failedAttempts: next.failedAttempts, lockedUntil: next.lockedUntil };
}

// Auch zwei rasche gleichzeitige Aufrufe dürfen keinen Fehlversuch verlieren.
let verificationQueue = Promise.resolve();
export function verifyPin(code) {
  const result = verificationQueue.then(() => checkPin(code));
  verificationQueue = result.catch(() => undefined);
  return result;
}

// Für "Alle Daten löschen": Code entfernen, danach wird er neu festgelegt.
export async function clearPin() {
  await SecureStore.deleteItemAsync(PIN_KEY);
}
