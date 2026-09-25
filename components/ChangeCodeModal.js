// Dialog zum Ändern des App-Codes in drei Schritten:
// 1. 'current' – aktuellen Code eingeben (sonst könnte jede Person, die das
//                entsperrte Handy in der Hand hat, den Code einfach ändern)
// 2. 'new'     – neuen Code wählen
// 3. 'confirm' – neuen Code zur Sicherheit wiederholen
// Gespeichert wird nur der Hash (siehe storage/pin.js).
import { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';
import { PIN_LENGTH, setPin, verifyPin } from '../storage/pin';
import Button from './Button';
import CodeDots from './CodeDots';
import FieldError from './FieldError';
import Keypad from './Keypad';

// Titel und Beschreibung je Schritt
const TEXTS = {
  current: { title: 'Aktueller Code', description: 'Gib zuerst deinen jetzigen Code ein.' },
  new: { title: 'Neuen Code wählen', description: `Wähle einen neuen ${PIN_LENGTH}-stelligen Code.` },
  confirm: { title: 'Code bestätigen', description: 'Gib denselben Code nochmals ein.' },
};

export default function ChangeCodeModal({ visible, onCancel, onDone }) {
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [step, setStep] = useState('current');
  const [firstCode, setFirstCode] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Beim Öffnen immer von vorne beginnen. React empfiehlt dafür das Anpassen
  // während des Renderns statt eines Effekts
  // (https://react.dev/learn/you-might-not-need-an-effect).
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setStep('current');
      setFirstCode('');
      setCode('');
      setError(null);
    }
  }

  function fail(text, nextStep) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setCode('');
    setError(text);
    setStep(nextStep);
  }

  async function handleComplete(enteredCode) {
    setBusy(true);
    try {
      if (step === 'current') {
        if (await verifyPin(enteredCode)) {
          setCode('');
          setStep('new');
        } else {
          fail('Falscher Code. Versuche es nochmals.', 'current');
        }
        return;
      }

      if (step === 'new') {
        setFirstCode(enteredCode);
        setCode('');
        setStep('confirm');
        return;
      }

      // step === 'confirm'
      if (enteredCode !== firstCode) {
        setFirstCode('');
        fail('Die beiden Codes stimmen nicht überein. Bitte nochmals von vorn.', 'new');
        return;
      }

      await setPin(enteredCode);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDone();
    } catch (saveError) {
      console.warn('Code konnte nicht geprüft oder gespeichert werden:', saveError);
      fail('Das hat nicht geklappt. Versuche es nochmals.', step);
    } finally {
      setBusy(false);
    }
  }

  function handleDigit(digit) {
    if (busy || code.length >= PIN_LENGTH) return;
    // Neue Ziffer hinten anhängen
    const next = code + digit;
    setCode(next);
    setError(null);
    // 6 Ziffern: diesen Schritt abschliessen
    if (next.length === PIN_LENGTH) {
      handleComplete(next);
    }
  }

  // Gleicher Aufbau wie PromptModal: abgedunkelter Hintergrund, Karte in der Mitte
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">
            {TEXTS[step].title}
          </Text>
          <Text style={styles.description}>{TEXTS[step].description}</Text>

          <View style={styles.dots}>
            <CodeDots length={PIN_LENGTH} filled={code.length} hasError={Boolean(error)} />
          </View>

          {/* Platz für Fehler und Beschreibung ist immer reserviert, damit
              die Tasten beim Tippen nicht springen */}
          <View style={styles.errorSlot}>
            <FieldError message={error} align="center" />
          </View>

          <Keypad
            onDigit={handleDigit}
            onDelete={() => setCode((current) => current.slice(0, -1))}
            disabled={busy}
          />

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
      minHeight: 40, // zwei Zeilen
    },
    dots: {
      marginTop: spacing.sm,
    },
    errorSlot: {
      minHeight: 48,
      alignSelf: 'stretch',
      justifyContent: 'center',
    },
    cancel: {
      alignSelf: 'stretch',
      marginTop: spacing.md,
    },
  });
}
