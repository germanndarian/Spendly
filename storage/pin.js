// Der 6-stellige App-Code.
// Der Code wird NIE im Klartext gespeichert: Wir legen nur einen Hash
// (SHA-256 mit zufälligem Salz) in expo-secure-store ab. Aus dem Hash lässt
// sich der Code nicht zurückrechnen.
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'spendly_pin_hash';
export const PIN_LENGTH = 6;

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
  // Aus dem Hash lässt sich der Code nicht zurückrechnen.
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${code}`);
}

// Gibt es schon einen Code? (Beim allerersten Start: nein)
export async function hasPin() {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  return stored !== null;
}

// Code festlegen oder ändern. Gespeichert wird "salz:hash".
export async function setPin(code) {
  const salt = await createSalt();
  const digest = await hashCode(code, salt);
  await SecureStore.setItemAsync(PIN_KEY, `${salt}:${digest}`);
}

// Eingegebenen Code prüfen: gleich salzen, gleich hashen, vergleichen.
export async function verifyPin(code) {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  // Noch kein Code festgelegt -> kann auch nicht stimmen
  if (!stored) return false;

  // Gespeichert ist «salz:hash» – hier wieder in die zwei Teile trennen
  const [salt, digest] = stored.split(':');
  const candidate = await hashCode(code, salt);
  return candidate === digest;
}

// Für "Alle Daten löschen": Code entfernen, danach wird er neu festgelegt.
export async function clearPin() {
  await SecureStore.deleteItemAsync(PIN_KEY);
}
