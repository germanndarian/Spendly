// Dialog zum Ändern des App-Codes: neuen Code eingeben und bestätigen.
// Gespeichert wird nur der Hash (siehe storage/pin.js).
import { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';
import { PIN_LENGTH, setPin } from '../storage/pin';
import Button from './Button';
import CodeDots from './CodeDots';
import Keypad from './Keypad';

export default function ChangeCodeModal({ visible, onCancel, onDone }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [step, setStep] = useState('new'); // 'new' oder 'confirm'
  const [firstCode, setFirstCode] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);

  // Beim Öffnen immer von vorne beginnen. React empfiehlt dafür das Anpassen
  // während des Renderns statt eines Effekts
  // (https://react.dev/learn/you-might-not-need-an-effect).
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setStep('new');
      setFirstCode('');
      setCode('');
      setError(null);
    }
  }

  async function handleComplete(enteredCode) {
    if (step === 'new') {
      setFirstCode(enteredCode);
      setCode('');
      setStep('confirm');
      return;
    }

    if (enteredCode !== firstCode) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStep('new');
      setFirstCode('');
      setCode('');
      setError('Die beiden Codes stimmen nicht überein. Bitte nochmals von vorn.');
      return;
    }

    try {
      await setPin(enteredCode);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDone();
    } catch (saveError) {
      console.warn('Code konnte nicht gespeichert werden:', saveError);
      setCode('');
      setError('Der Code konnte nicht gespeichert werden. Versuche es nochmals.');
    }
  }

  function handleDigit(digit) {
    if (code.length >= PIN_LENGTH) return;
    const next = code + digit;
    setCode(next);
    setError(null);
    if (next.length === PIN_LENGTH) {
      handleComplete(next);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">
            {step === 'new' ? 'Neuen Code wählen' : 'Code bestätigen'}
          </Text>
          <Text style={styles.description}>
            {step === 'new'
              ? `Wähle einen neuen ${PIN_LENGTH}-stelligen Code.`
              : 'Gib denselben Code nochmals ein.'}
          </Text>

          <View style={styles.dots}>
            <CodeDots length={PIN_LENGTH} filled={code.length} hasError={Boolean(error)} />
          </View>

          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <Keypad onDigit={handleDigit} onDelete={() => setCode((current) => current.slice(0, -1))} />

          <Button title="Abbrechen" variant="secondary" size="medium" onPress={onCancel} style={styles.cancel} />
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.screen,
    },
    card: {
      width: '100%',
      maxWidth: 380,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: spacing.lg,
      alignItems: 'center',
    },
    title: {
      ...typography.headlineSm,
      color: colors.text,
      textAlign: 'center',
    },
    description: {
      ...typography.bodyMd,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    dots: {
      marginTop: spacing.md,
      marginBottom: spacing.md,
    },
    error: {
      ...typography.labelMd,
      color: colors.danger,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    cancel: {
      alignSelf: 'stretch',
      marginTop: spacing.md,
    },
  });
}
