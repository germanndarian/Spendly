// Screen 1 · Entsperren (Startscreen, Special Feature)
// Zustände:
// - 'checking' : prüft Code und Biometrie
// - 'biometric': Button "Mit Face ID entsperren" (bei Fehler Hinweis + erneut)
// - 'code'     : eigener 6-stelliger Code über den Zahlenblock
// - 'setup'    : allererster Start – Code festlegen (zweimal eingeben)
// - 'confirm'  : Code zur Sicherheit wiederholen
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';
import Button from '../components/Button';
import CodeDots from '../components/CodeDots';
import FieldError from '../components/FieldError';
import Icon from '../components/Icon';
import Keypad from '../components/Keypad';
import Pill from '../components/Pill';
import Wordmark from '../components/Wordmark';
import { useData } from '../storage/DataContext';
import { hasPin, PIN_LENGTH, setPin, verifyPin } from '../storage/pin';
import {
  authenticate,
  BIOMETRIC_ICON,
  BIOMETRIC_NAME,
  canFixInSettings,
  checkBiometrics,
  classifyAuthError,
  getUnavailableText,
  UNLOCK_LABEL,
} from '../utils/biometrics';

const MAX_ATTEMPTS = 3; // danach geht es nur noch über den Code

// Titel und Untertitel je Zustand
const TEXTS = {
  code: { title: 'Code eingeben', subtitle: `Gib deinen ${PIN_LENGTH}-stelligen Code ein.` },
  setup: { title: 'Code festlegen', subtitle: `Wähle einen ${PIN_LENGTH}-stelligen Code für Spendly.` },
  confirm: { title: 'Code bestätigen', subtitle: 'Gib denselben Code nochmals ein.' },
};

export default function LockScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { settings, deleteAllData } = useData();

  const [mode, setMode] = useState('checking');
  const [biometry, setBiometry] = useState({ available: false, reason: null });
  const [code, setCode] = useState('');
  const [firstCode, setFirstCode] = useState(''); // beim Festlegen: erste Eingabe
  // Zwei getrennte Texte, damit der Zahlenblock beim Tippen nicht springt:
  // - notice : Hinweis oben (z. B. "Face ID ist nicht erlaubt"), bleibt stehen
  // - message: Fehler (z. B. "Falscher Code"), verschwindet beim Weitertippen
  const [notice, setNotice] = useState(null);
  const [message, setMessage] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);
  // Pulsieren des Symbols, solange der Scan läuft (Feedback laut Ergonomie-Checkliste)
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!busy) {
      pulse.setValue(0);
      return undefined;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [busy, pulse]);

  // Beim Öffnen: Gibt es schon einen Code? Steht Biometrie zur Verfügung?
  useEffect(() => {
    let active = true;

    async function prepare() {
      let codeExists = false;
      let biometryState = { available: false, reason: 'error' };
      try {
        [codeExists, biometryState] = await Promise.all([hasPin(), checkBiometrics()]);
      } catch (error) {
        // Lieber die Code-Eingabe zeigen als im Ladezustand stehen bleiben
        console.warn('Sperre konnte nicht geprüft werden:', error);
        if (active) {
          setMode('code');
          setNotice('Die Sperre konnte nicht geprüft werden. Entsperre Spendly mit deinem Code.');
        }
        return;
      }
      if (!active) return;

      setBiometry(biometryState);

      if (!codeExists) {
        // Allererster Start: zuerst einen Code festlegen
        setMode('setup');
      } else if (biometryState.available && settings.biometricEnabled) {
        setMode('biometric');
      } else {
        setMode('code');
        // Hinweis nur, wenn Biometrie nicht geht – nicht, wenn sie
        // in den Einstellungen bewusst ausgeschaltet wurde
        if (!biometryState.available) {
          setNotice(getUnavailableText(biometryState.reason));
        }
      }
    }

    prepare();
    return () => {
      active = false;
    };
  }, [settings.biometricEnabled]);

  // replace statt navigate: Der Lock-Screen wird ersetzt,
  // man kommt also nicht mit "Zurück" wieder hierher.
  const unlock = useCallback(() => {
    navigation.replace('Main');
  }, [navigation]);

  // --- Biometrie --------------------------------------------------------
  async function runBiometric() {
    setBusy(true);
    setMessage(null);
    const result = await authenticate();
    setBusy(false);

    if (result.success) {
      unlock();
      return;
    }

    const outcome = classifyAuthError(result.error);

    // Bewusst abgebrochen: einfach hier bleiben, das zählt nicht als Fehlversuch
    if (outcome === 'cancel') return;

    // Im System-Dialog auf "Code verwenden" getippt
    if (outcome === 'fallback') {
      switchToCode(null);
      return;
    }

    // Biometrie geht gerade gar nicht (z. B. Berechtigung in den iOS-
    // Einstellungen entzogen): direkt zur Code-Eingabe mit Hinweis
    if (outcome !== 'failed') {
      setBiometry({ available: false, reason: outcome });
      switchToCode(getUnavailableText(outcome));
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    if (nextAttempts >= MAX_ATTEMPTS) {
      // Nach 3 Fehlversuchen nicht in der Sackgasse stehen lassen
      switchToCode(`${BIOMETRIC_NAME} hat ${MAX_ATTEMPTS} Mal nicht funktioniert. Entsperre Spendly mit deinem Code.`);
    } else {
      setMessage(`${BIOMETRIC_NAME} hat dich nicht erkannt.`);
    }
  }

  function switchToCode(text) {
    setCode('');
    setMessage(null);
    setNotice(text);
    setMode('code');
  }

  // --- Code -------------------------------------------------------------
  function handleDigit(digit) {
    if (busy || code.length >= PIN_LENGTH) return;

    const next = code + digit;
    setCode(next);
    setMessage(null);

    if (next.length === PIN_LENGTH) {
      submitCode(next);
    }
  }

  function handleDelete() {
    setCode((current) => current.slice(0, -1));
    setMessage(null);
  }

  async function submitCode(enteredCode) {
    setBusy(true);
    try {
      if (mode === 'setup') {
        // Erste Eingabe merken und zur Bestätigung wechseln
        setFirstCode(enteredCode);
        setCode('');
        setMode('confirm');
        return;
      }

      if (mode === 'confirm') {
        if (enteredCode === firstCode) {
          await setPin(enteredCode);
          unlock();
        } else {
          failCode('Die beiden Codes stimmen nicht überein. Bitte nochmals von vorn.');
          setFirstCode('');
          setMode('setup');
        }
        return;
      }

      // mode === 'code'
      if (await verifyPin(enteredCode)) {
        unlock();
      } else {
        failCode('Falscher Code. Versuche es nochmals.');
      }
    } catch (error) {
      console.warn('Code konnte nicht geprüft werden:', error);
      failCode('Der Code konnte nicht geprüft werden. Versuche es nochmals.');
    } finally {
      setBusy(false);
    }
  }

  function failCode(text) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setCode('');
    setMessage(text);
  }

  // "Code vergessen?" – ohne Konto gibt es nur den Weg über das Löschen.
  function handleForgotCode() {
    Alert.alert(
      'Code vergessen?',
      'Der Code lässt sich nicht wiederherstellen. Du kannst nur alle Daten löschen und neu starten.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Alle Daten löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllData();
              setCode('');
              setFirstCode('');
              setMessage(null);
              setNotice(null);
              setMode('setup');
            } catch (error) {
              console.warn('Daten konnten nicht gelöscht werden:', error);
              setMessage('Das hat nicht geklappt. Versuche es nochmals.');
            }
          },
        },
      ]
    );
  }

  // --- Anzeige ----------------------------------------------------------
  if (mode === 'checking') {
    return (
      <SafeAreaView style={[styles.screen, styles.centerOnly]}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  const isCodeMode = mode === 'code' || mode === 'setup' || mode === 'confirm';
  const hasFailed = mode === 'biometric' && message !== null;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Wordmark />
        <Pill label="Geschützt" dotColor={colors.accent} />
      </View>

      {isCodeMode ? (
        <View style={styles.codeArea}>
          {/* Hinweis, wenn Face ID nicht zur Verfügung steht */}
          {notice !== null && (
            <View style={styles.banner} accessibilityRole="alert">
              <View style={styles.bannerTop}>
                <Icon name="info" size={18} color={colors.textSecondary} />
                <Text style={styles.bannerText}>{notice}</Text>
              </View>
              {/* Ein Link in die Einstellungen hilft nur, wenn es dort
                  überhaupt etwas zu erlauben gibt */}
              {canFixInSettings(biometry.reason) ? (
                <Pressable
                  onPress={() => Linking.openSettings()}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.bannerLink, pressed && styles.pressedSurface]}
                >
                  <Text style={styles.bannerLinkText}>In Einstellungen erlauben</Text>
                </Pressable>
              ) : null}
            </View>
          )}

          <Text style={styles.codeTitle} accessibilityRole="header">
            {TEXTS[mode].title}
          </Text>
          {/* Feste Höhe für zwei Zeilen: Die Tasten stehen bei jedem Schritt
              an derselben Stelle (Muskelgedächtnis beim Code-Tippen) */}
          <Text style={[styles.subtitle, styles.codeSubtitle]}>{TEXTS[mode].subtitle}</Text>

          <View style={styles.dots}>
            <CodeDots length={PIN_LENGTH} filled={code.length} hasError={message !== null} />
          </View>

          {/* Platz für den Fehler ist immer reserviert – auch hier springt nichts */}
          <View style={styles.errorSlot}>
            <FieldError message={message} align="center" />
          </View>

          <Keypad onDigit={handleDigit} onDelete={handleDelete} disabled={busy} />

          {/* Zurück zu Face ID, falls es zur Verfügung steht */}
          {mode === 'code' && biometry.available && settings.biometricEnabled && (
            <Button
              title={UNLOCK_LABEL}
              variant="text"
              size="medium"
              icon={BIOMETRIC_ICON}
              iconFamily="mci"
              onPress={() => {
                setCode('');
                setMessage(null);
                setNotice(null);
                setAttempts(0);
                setMode('biometric');
              }}
              style={styles.bottomAction}
            />
          )}

          {mode === 'code' && (
            <Button
              title="Code vergessen?"
              variant="text"
              size="medium"
              onPress={handleForgotCode}
              style={styles.bottomAction}
            />
          )}
        </View>
      ) : (
        <>
          {/* Mitte: Symbol und Begrüssung */}
          <View style={styles.center}>
            <Animated.View
              style={[
                styles.iconCircle,
                hasFailed && styles.iconCircleError,
                { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] },
              ]}
            >
              <Icon
                family="mci"
                name={BIOMETRIC_ICON}
                size={44}
                color={hasFailed ? colors.danger : colors.accent}
              />
            </Animated.View>
            <Text style={styles.title} accessibilityRole="header">
              {hasFailed ? message : 'Willkommen zurück'}
            </Text>
            <Text style={styles.subtitle}>
              {hasFailed
                ? 'Versuch es nochmals oder verwende deinen Code.'
                : 'Entsperre Spendly, um deine Ausgaben zu sehen.'}
            </Text>
          </View>

          {/* Unten in der Daumenzone: Aktionen */}
          <View style={styles.actions}>
            <Button
              title={hasFailed ? 'Erneut versuchen' : UNLOCK_LABEL}
              icon={hasFailed ? 'refresh-cw' : BIOMETRIC_ICON}
              iconFamily={hasFailed ? undefined : 'mci'}
              onPress={runBiometric}
              disabled={busy}
            />
            <Button
              title="Code verwenden"
              variant="text"
              size="medium"
              onPress={() => switchToCode(null)}
            />
            <View style={styles.privacy}>
              <Icon name="lock" size={14} color={colors.textSecondary} />
              <Text style={styles.privacyText}>
                Deine biometrischen Daten verlassen nie dein Gerät.
              </Text>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.screen,
    },
    centerOnly: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    topBar: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    iconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accentSoft,
      marginBottom: spacing.lg,
    },
    iconCircleError: { backgroundColor: colors.dangerSoft },
    title: {
      ...typography.headlineMd,
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.bodyLg,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 300,
    },
    actions: {
      gap: spacing.sm,
      paddingBottom: spacing.md,
    },
    privacy: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: spacing.sm,
    },
    privacyText: {
      ...typography.labelSm,
      color: colors.textSecondary,
    },
    // --- Code-Eingabe ---
    codeArea: {
      flex: 1,
      alignItems: 'center',
      paddingTop: spacing.sm,
    },
    banner: {
      alignSelf: 'stretch',
      minHeight: 56,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginBottom: spacing.lg,
    },
    bannerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    bannerText: {
      ...typography.labelMd,
      color: colors.text,
      flex: 1,
    },
    bannerLink: {
      minHeight: 48,
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
      marginLeft: 26, // bündig mit dem Text neben dem Symbol
      borderRadius: 8,
    },
    pressedSurface: { backgroundColor: colors.pressed },
    bannerLinkText: {
      ...typography.labelMd,
      color: colors.accent,
    },
    codeTitle: {
      ...typography.headlineLg,
      color: colors.text,
      textAlign: 'center',
    },
    codeSubtitle: { minHeight: 48 },
    dots: {
      marginTop: spacing.md,
    },
    errorSlot: {
      minHeight: 56,
      alignSelf: 'stretch',
      justifyContent: 'center',
    },
    bottomAction: { marginTop: spacing.sm },
  });
}
