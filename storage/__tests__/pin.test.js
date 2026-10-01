import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { getPinStatus, nextFailedAttempt, setPin, verifyPin } from '../pin';

jest.mock('expo-secure-store', () => {
  const values = new Map();
  return {
    getItemAsync: jest.fn(async (key) => values.get(key) ?? null),
    setItemAsync: jest.fn(async (key, value) => { values.set(key, value); }),
    deleteItemAsync: jest.fn(async (key) => { values.delete(key); }),
  };
});
jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'sha256' },
  getRandomBytesAsync: async (length) => require('node:crypto').randomBytes(length),
  digestStringAsync: async (_, text) => require('node:crypto').createHash('sha256').update(text).digest('hex'),
}));

beforeEach(async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-10-01T08:00:00Z'));
  await setPin('123456');
});
afterEach(() => jest.useRealTimers());

describe('gespeicherte PIN-Sperre', () => {
  test('nach fünf Fehlern 30 Sekunden; auch der richtige Code wartet bis zur Frist', async () => {
    for (let i = 0; i < 4; i++) expect((await verifyPin('000000')).lockedUntil).toBe(0);
    const fifth = await verifyPin('000000');
    expect(fifth).toEqual({ valid: false, failedAttempts: 5, lockedUntil: Date.now() + 30000 });
    expect((await verifyPin('123456')).valid).toBe(false);
    expect(await getPinStatus()).toEqual({ failedAttempts: 5, lockedUntil: fifth.lockedUntil });
    jest.advanceTimersByTime(30000);
    expect(await verifyPin('123456')).toEqual({ valid: true, failedAttempts: 0, lockedUntil: 0 });
  });

  test('nach Ablauf führt ein weiterer Fehler zu längerer Sperre', async () => {
    for (let i = 0; i < 5; i++) await verifyPin('000000');
    jest.advanceTimersByTime(30000);
    expect((await verifyPin('000000')).lockedUntil).toBe(Date.now() + 60000);
    expect(nextFailedAttempt({ failedAttempts: 50 }, 100).lockedUntil).toBe(300100);
  });

  test('gleichzeitige Prüfungen verlieren keinen Fehlversuch', async () => {
    await Promise.all(Array.from({ length: 5 }, () => verifyPin('000000')));
    expect((await getPinStatus()).failedAttempts).toBe(5);
  });

  test('ein früherer salz:hash-Eintrag bleibt gültig und erhält das neue Format', async () => {
    const digest = await Crypto.digestStringAsync('sha256', 'legacy:111111');
    await SecureStore.setItemAsync('spendly_pin_hash', `legacy:${digest}`);
    expect((await verifyPin('111111')).valid).toBe(true);
    const stored = JSON.parse(await SecureStore.getItemAsync('spendly_pin_hash'));
    expect(stored).toMatchObject({ salt: 'legacy', failedAttempts: 0, lockedUntil: 0 });
    expect(stored).not.toHaveProperty('code');
  });

  test('ein neuer bestätigter Code ersetzt den alten und hebt die Sperre auf', async () => {
    for (let i = 0; i < 5; i++) await verifyPin('000000');
    await setPin('654321');
    expect((await verifyPin('654321')).valid).toBe(true);
    expect((await verifyPin('123456')).valid).toBe(false);
  });

  test('ungültige neue Codes verändern den bestehenden Code nicht', async () => {
    await expect(setPin('12')).rejects.toThrow();
    expect((await verifyPin('123456')).valid).toBe(true);
  });
});
