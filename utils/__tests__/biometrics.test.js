import { beforeEach, describe, expect, jest, test } from '@jest/globals';

let mockPlatform = 'ios';
let mockOwnership = null;
jest.mock('react-native', () => ({
  Platform: { get OS() { return mockPlatform; } },
  TurboModuleRegistry: { get: () => null },
}));
jest.mock('expo-constants', () => ({ get appOwnership() { return mockOwnership; } }));
jest.mock('expo-local-authentication', () => ({
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
  supportedAuthenticationTypesAsync: jest.fn(async () => [2]),
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
  authenticateAsync: jest.fn(async () => ({ success: true })),
}));

beforeEach(() => {
  jest.resetModules();
  mockPlatform = 'ios';
  mockOwnership = null;
});

describe('Biometrie nach vorhandener Hardware', () => {
  test('iPhone mit Fingerabdruck heisst Touch ID', async () => {
    require('expo-local-authentication').supportedAuthenticationTypesAsync.mockResolvedValue([1]);
    expect(await require('../biometrics').checkBiometrics()).toMatchObject({ available: true, name: 'Touch ID', icon: 'fingerprint' });
  });

  test('iPhone mit Gesichtserkennung heisst Face ID', async () => {
    expect(await require('../biometrics').checkBiometrics()).toMatchObject({ available: true, name: 'Face ID' });
  });

  test('Android mit Gesichtserkennung wird nicht als Fingerabdruck beschriftet', async () => {
    mockPlatform = 'android';
    expect(await require('../biometrics').checkBiometrics()).toMatchObject({ available: true, name: 'Gesichtserkennung' });
  });

  test('fehlender Sensor führt zu Code-Fallback', async () => {
    const api = require('expo-local-authentication');
    api.supportedAuthenticationTypesAsync.mockResolvedValue([]);
    api.hasHardwareAsync.mockResolvedValue(false);
    expect(await require('../biometrics').checkBiometrics()).toMatchObject({ available: false, reason: 'noHardware', name: 'Biometrie' });
  });

  test('nicht eingerichtete Biometrie führt zu Code-Fallback', async () => {
    require('expo-local-authentication').isEnrolledAsync.mockResolvedValue(false);
    expect(await require('../biometrics').checkBiometrics()).toMatchObject({ available: false, reason: 'notEnrolled' });
  });

  test('Expo Go sperrt Face ID auf iOS', async () => {
    mockOwnership = 'expo';
    expect(await require('../biometrics').checkBiometrics()).toMatchObject({ available: false, reason: 'expoGo' });
  });

  test('Expo Go sperrt vorhandene Touch ID nicht pauschal', async () => {
    mockOwnership = 'expo';
    require('expo-local-authentication').supportedAuthenticationTypesAsync.mockResolvedValue([1]);
    expect(await require('../biometrics').checkBiometrics()).toMatchObject({ available: true, name: 'Touch ID' });
  });

  test('Systemabbruch zählt nicht als falsches Gesicht; Sperre führt zum Code', () => {
    const { classifyAuthError } = require('../biometrics');
    expect(classifyAuthError('user_cancel')).toBe('cancel');
    expect(classifyAuthError('system_cancel')).toBe('cancel');
    expect(classifyAuthError('lockout')).toBe('lockout');
    expect(classifyAuthError('authentication_failed')).toBe('failed');
  });

  test('kein stiller Fallback auf den Geräte-Code; API-Fehler wird abgefangen', async () => {
    const { authenticate } = require('../biometrics');
    const api = require('expo-local-authentication');
    await authenticate();
    expect(api.authenticateAsync).toHaveBeenCalledWith(expect.objectContaining({ disableDeviceFallback: true }));
    api.authenticateAsync.mockRejectedValue(new Error('Gerät antwortet nicht'));
    expect(await authenticate()).toEqual({ success: false, error: 'unknown' });
  });
});
