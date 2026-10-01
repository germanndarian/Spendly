import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { Alert } from 'react-native';
import { authenticate, checkBiometrics } from '../../utils/biometrics';
import { setPin } from '../../storage/pin';
import LockScreen from '../LockScreen';

let mockEnabled = false;
const mockDeleteAllData = jest.fn(async () => {});
let renderer;
let consoleError;

jest.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator', Pressable: 'Pressable', Text: 'Text', View: 'View',
  StyleSheet: { create: (styles) => styles },
  Platform: { OS: 'ios', select: (values) => values.ios ?? values.default },
  Alert: { alert: jest.fn() }, Linking: { openSettings: jest.fn() },
  TurboModuleRegistry: { get: () => null },
  Animated: {
    View: 'AnimatedView',
    Value: class { setValue() {} interpolate() { return 1; } },
    timing: () => ({}), sequence: () => ({}), loop: () => ({ start() {}, stop() {} }),
  },
}));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
jest.mock('expo-haptics', () => ({ notificationAsync: jest.fn(), NotificationFeedbackType: { Error: 'error' } }));
jest.mock('../../theme/ThemeContext', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('../../storage/DataContext', () => ({ useData: () => ({ settings: { biometricEnabled: mockEnabled }, deleteAllData: mockDeleteAllData }) }));
jest.mock('../../storage/pin', () => ({
  PIN_LENGTH: 6, hasPin: async () => true, getPinStatus: async () => ({ lockedUntil: 0 }),
  setPin: jest.fn(), verifyPin: jest.fn(),
}));
jest.mock('../../utils/biometrics', () => ({
  checkBiometrics: jest.fn(async () => ({ available: true, name: 'Face ID', unlockLabel: 'Mit Face ID entsperren' })),
  authenticate: jest.fn(async () => ({ success: true })),
  canFixInSettings: () => false, classifyAuthError: () => 'cancel', getUnavailableText: () => '',
}));
jest.mock('../../components/Button', () => 'Button');
jest.mock('../../components/CodeDots', () => 'CodeDots');
jest.mock('../../components/FieldError', () => 'FieldError');
jest.mock('../../components/Icon', () => 'Icon');
jest.mock('../../components/Keypad', () => 'Keypad');
jest.mock('../../components/Pill', () => 'Pill');
jest.mock('../../components/Wordmark', () => 'Wordmark');

beforeEach(() => {
  jest.clearAllMocks();
  mockEnabled = false;
  // React 19 kündigt den Renderer ab; andere Fehler bleiben im Test sichtbar.
  const originalError = console.error;
  consoleError = jest.spyOn(console, 'error').mockImplementation((message, ...args) => {
    if (String(message).startsWith('react-test-renderer is deprecated')) return;
    originalError(message, ...args);
  });
});
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  consoleError.mockRestore();
});

async function openForgotCode() {
  await act(async () => { renderer = TestRenderer.create(<LockScreen navigation={{ replace: jest.fn() }} />); });
  const button = (title) => renderer.root.findAllByType('Button').find((item) => item.props.title === title);
  if (mockEnabled) await act(async () => button('Code verwenden').props.onPress());
  checkBiometrics.mockClear();
  await act(async () => button('Code vergessen?').props.onPress());
}

test('ausgeschaltete Biometrie erlaubt keine datenerhaltende Code-Wiederherstellung', async () => {
  await openForgotCode();
  expect(checkBiometrics).not.toHaveBeenCalled();
  expect(authenticate).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenLastCalledWith('Code vergessen?', expect.any(String), expect.arrayContaining([
    expect.objectContaining({ text: 'Abbrechen', style: 'cancel' }),
    expect.objectContaining({ text: 'Alle Daten löschen', style: 'destructive' }),
  ]));
  expect(mockDeleteAllData).not.toHaveBeenCalled();
  expect(setPin).not.toHaveBeenCalled();
});

test('eingeschaltete Biometrie verlangt zuerst die ausdrückliche Identitätsprüfung', async () => {
  mockEnabled = true;
  await openForgotCode();
  expect(checkBiometrics).toHaveBeenCalledTimes(1);
  expect(Alert.alert).toHaveBeenLastCalledWith('Code zurücksetzen?', expect.any(String), expect.arrayContaining([
    expect.objectContaining({ text: 'Identität bestätigen' }),
  ]));
  expect(authenticate).not.toHaveBeenCalled();
  expect(mockDeleteAllData).not.toHaveBeenCalled();
  expect(setPin).not.toHaveBeenCalled();
});
