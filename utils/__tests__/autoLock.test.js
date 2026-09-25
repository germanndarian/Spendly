// Unit-Tests für utils/autoLock.js (Sperrzeit)
import { AUTO_LOCK_OPTIONS, getAutoLockLabel, shouldAutoLock } from '../autoLock';

const MINUTE = 60 * 1000;
// Fester Zeitpunkt (in ms), damit die Tests immer gleich laufen
const NOW = 1_800_000_000_000;

describe('shouldAutoLock', () => {
  test('"Nach 1 Minute": 59 Sekunden sind noch ok, 60 Sekunden sperren', () => {
    expect(shouldAutoLock(NOW - 59 * 1000, NOW, 1)).toBe(false);
    expect(shouldAutoLock(NOW - MINUTE, NOW, 1)).toBe(true);
  });

  test('"Nach 5 Minuten"', () => {
    expect(shouldAutoLock(NOW - 4 * MINUTE, NOW, 5)).toBe(false);
    expect(shouldAutoLock(NOW - 5 * MINUTE, NOW, 5)).toBe(true);
  });

  test('"Sofort" sperrt nach jedem Wechsel in den Hintergrund', () => {
    expect(shouldAutoLock(NOW, NOW, 0)).toBe(true);
  });

  test('"Nie" sperrt nie', () => {
    expect(shouldAutoLock(NOW - 60 * MINUTE, NOW, null)).toBe(false);
  });

  test('ohne Hintergrund-Zeitpunkt wird nicht gesperrt', () => {
    expect(shouldAutoLock(null, NOW, 1)).toBe(false);
  });
});

describe('getAutoLockLabel', () => {
  test('liefert den Text zur gespeicherten Sperrzeit', () => {
    expect(getAutoLockLabel(0)).toBe('Sofort');
    expect(getAutoLockLabel(1)).toBe('Nach 1 Minute');
    expect(getAutoLockLabel(null)).toBe('Nie');
  });

  test('unbekannte Werte zeigen den Standard "Nach 1 Minute"', () => {
    expect(getAutoLockLabel(42)).toBe('Nach 1 Minute');
  });

  test('es gibt vier Auswahlmöglichkeiten', () => {
    expect(AUTO_LOCK_OPTIONS).toHaveLength(4);
  });
});
