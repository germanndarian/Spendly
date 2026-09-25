// Face ID bzw. Fingerabdruck (expo-local-authentication).
// Die App bekommt vom Gerät nur "erfolgreich" oder "nicht erfolgreich" –
// Gesichts- und Fingerabdruckdaten sieht sie nie.
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';

const IS_ANDROID = Platform.OS === 'android';

// Android spricht von Fingerabdruck, iOS von Face ID
export const BIOMETRIC_NAME = IS_ANDROID ? 'Fingerabdruck' : 'Face ID';
export const UNLOCK_LABEL = IS_ANDROID ? 'Mit Fingerabdruck entsperren' : 'Mit Face ID entsperren';
export const BIOMETRIC_ICON = IS_ANDROID ? 'fingerprint' : 'face-recognition';

// Laut Expo-Dokumentation funktioniert Face ID auf iOS nicht in Expo Go.
// appOwnership ist genau dann 'expo', wenn die App in Expo Go läuft.
// Darum zeigen wir dort direkt die Code-Eingabe statt eines Buttons,
// der sowieso nicht funktionieren würde.
const IS_EXPO_GO = Constants.appOwnership === 'expo';
const BLOCKED_IN_EXPO_GO = IS_EXPO_GO && Platform.OS === 'ios';

// Prüft der Reihe nach: Sensor vorhanden? Biometrie eingerichtet?
// Gibt { available, reason } zurück und wirft nie einen Fehler.
export async function checkBiometrics() {
  if (BLOCKED_IN_EXPO_GO) {
    return { available: false, reason: 'expoGo' };
  }
  try {
    if (!(await LocalAuthentication.hasHardwareAsync())) {
      // Achtung: iOS meldet "kein Sensor" auch dann, wenn Face ID für Spendly
      // verboten wurde. Welche Art von Sensor das Gerät hat, weiss es aber
      // trotzdem – so können wir die beiden Fälle unterscheiden.
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return { available: false, reason: types.length > 0 ? 'notAllowed' : 'noHardware' };
    }
    // Sensor ist da – aber ist auch ein Gesicht bzw. Finger gespeichert?
    if (!(await LocalAuthentication.isEnrolledAsync())) {
      return { available: false, reason: 'notEnrolled' };
    }
    return { available: true, reason: null };
  } catch {
    return { available: false, reason: 'error' };
  }
}

// Passender Hinweis, wenn Biometrie nicht zur Verfügung steht.
export function getUnavailableText(reason) {
  // switch wählt je nach Grund den passenden Text aus
  switch (reason) {
    case 'expoGo':
      return `${BIOMETRIC_NAME} ist in Expo Go nicht erlaubt. Entsperre Spendly mit deinem Code.`;
    case 'notAllowed':
      return `${BIOMETRIC_NAME} ist für Spendly nicht erlaubt. Entsperre Spendly mit deinem Code.`;
    case 'notEnrolled':
      return `${BIOMETRIC_NAME} ist auf diesem Gerät nicht eingerichtet. Entsperre Spendly mit deinem Code.`;
    case 'noHardware':
      return `Dieses Gerät unterstützt ${BIOMETRIC_NAME} nicht. Entsperre Spendly mit deinem Code.`;
    case 'lockout':
      return `${BIOMETRIC_NAME} ist nach zu vielen Versuchen vorübergehend gesperrt. Entsperre Spendly mit deinem Code.`;
    default:
      return `${BIOMETRIC_NAME} steht gerade nicht zur Verfügung. Entsperre Spendly mit deinem Code.`;
  }
}

// Nur bei diesen Gründen kann man in den Einstellungen des Handys etwas ändern
export function canFixInSettings(reason) {
  return reason === 'notAllowed' || reason === 'notEnrolled';
}

// Übersetzt den Fehler von authenticateAsync:
// - 'cancel'   : bewusst abgebrochen – kein Fehlversuch
// - 'fallback' : im System-Dialog auf "Code verwenden" getippt
// - ein Grund  : Biometrie geht gerade gar nicht (z. B. Berechtigung entzogen)
// - 'failed'   : normaler Fehlversuch (Gesicht nicht erkannt)
export function classifyAuthError(error) {
  switch (error) {
    case 'user_cancel':
    case 'system_cancel':
    case 'app_cancel':
      return 'cancel';
    case 'user_fallback':
      return 'fallback';
    case 'not_available':
      // Auf iOS heisst das: Face ID wurde für Spendly verboten
      return IS_ANDROID ? 'error' : 'notAllowed';
    case 'not_enrolled':
    case 'passcode_not_set':
      return 'notEnrolled';
    case 'lockout':
      return 'lockout';
    default:
      return 'failed';
  }
}

// Startet den Scan. Gibt immer ein Ergebnis zurück, stürzt nie ab.
export async function authenticate() {
  try {
    return await LocalAuthentication.authenticateAsync({
      promptMessage: UNLOCK_LABEL,
      cancelLabel: 'Abbrechen',
      fallbackLabel: 'Code verwenden',
      // Wir haben einen eigenen Code, deshalb nicht den Geräte-Code anbieten
      disableDeviceFallback: true,
    });
  } catch {
    return { success: false, error: 'unknown' };
  }
}
