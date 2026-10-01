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

// visible = sichtbar?, onCancel = Abbrechen, onDone = der neue Code ist gespeichert
export default function ChangeCodeModal({ visible, onCancel, onDone }) {
  // Aktuelle Farben holen (hell oder dunkel, je nach Einstellung)
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);

  // In welchem der drei Schritte sind wir? ('current', 'new' oder 'confirm')
  const [step, setStep] = useState('current');
  // Der neue Code aus Schritt 2, damit wir ihn in Schritt 3 vergleichen können
  const [firstCode, setFirstCode] = useState('');
  // Die Ziffern, die schon getippt sind
  const [code, setCode] = useState('');
  // Fehlermeldung (null = keine)
  const [error, setError] = useState(null);
  // true, solange gerade geprüft oder gespeichert wird (Tasten sind dann gesperrt)
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

  // Falsche Eingabe: vibrieren, Punkte leeren, Fehler zeigen und zum passenden Schritt wechseln
  function fail(text, nextStep) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setCode('');
    setError(text);
    setStep(nextStep);
  }

  // Wird aufgerufen, sobald alle 6 Ziffern getippt sind. Was passiert, hängt vom Schritt ab.
  async function handleComplete(enteredCode) {
    setBusy(true);
    try {
      // Schritt 1: Stimmt der aktuelle Code?
      if (step === 'current') {
        if (await verifyPin(enteredCode)) {
          setCode('');
          setStep('new');
        } else {
          fail('Falscher Code. Versuche es nochmals.', 'current');
        }
        return;
      }

      // Schritt 2: Den neuen Code merken und zur Bestätigung wechseln
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

      // Beide Eingaben stimmen überein: neuen Code (als Hash) speichern
      await setPin(enteredCode);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Dem Screen melden, dass der Code geändert ist
      onDone();
    } catch (saveError) {
      console.warn('Code konnte nicht geprüft oder gespeichert werden:', saveError);
      fail('Das hat nicht geklappt. Versuche es nochmals.', step);
    } finally {
      setBusy(false);
    }
  }

  // Wird bei jedem Tipp auf eine Ziffer aufgerufen
  function handleDigit(digit) {
    // Während der Prüfung oder wenn der Code schon voll ist: nichts tun
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

// Alle Styles dieser Komponente. Als Funktion, weil sie die aktuellen Farben brauchen.
function createStyles(colors) {
  return StyleSheet.create({
    // Abgedunkelter Hintergrund, der Dialog steht in der Mitte
    overlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.screen,
    },
    // Weisse Dialog-Karte, höchstens 380 pt breit
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
    // Titel des aktuellen Schritts
    title: {
      ...typography.headlineSm,
      color: colors.text,
      textAlign: 'center',
    },
    // Erklärung unter dem Titel
    description: {
      ...typography.bodyMd,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
      minHeight: 40, // zwei Zeilen
    },
    // Abstand über den Code-Punkten
    dots: {
      marginTop: spacing.sm,
    },
    // Reservierter Platz für die Fehlermeldung
    errorSlot: {
      minHeight: 48,
      alignSelf: 'stretch',
      justifyContent: 'center',
    },
    // Abbrechen-Button: volle Breite, mit Abstand zum Zahlenblock
    cancel: {
      alignSelf: 'stretch',
      marginTop: spacing.md,
    },
  });
}
