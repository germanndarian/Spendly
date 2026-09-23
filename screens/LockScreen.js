// Screen 1 · Entsperren (Startscreen, Special Feature)
// Phase 1: nur das Layout. Beide Buttons entsperren direkt.
// Die echte Prüfung mit Face ID / Fingerabdruck und Code folgt in Phase 3.
import { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import Button from '../components/Button';
import Icon from '../components/Icon';
import Pill from '../components/Pill';
import Wordmark from '../components/Wordmark';

// Android spricht von Fingerabdruck, iOS von Face ID
const IS_ANDROID = Platform.OS === 'android';
const BIOMETRIC_LABEL = IS_ANDROID ? 'Mit Fingerabdruck entsperren' : 'Mit Face ID entsperren';
const BIOMETRIC_ICON = IS_ANDROID ? 'fingerprint' : 'face-recognition';
const PRIVACY_TEXT = IS_ANDROID
  ? 'Deine Fingerabdruckdaten verlassen nie dein Gerät.'
  : 'Deine Gesichtsdaten verlassen nie dein Gerät.';

export default function LockScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // replace statt navigate: Der Lock-Screen wird ersetzt,
  // man kann also nicht mit "Zurück" wieder hierher.
  function unlock() {
    navigation.replace('Main');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Wordmark />
        <Pill label="Geschützt" dotColor={colors.accent} />
      </View>

      {/* Mitte: Symbol und Begrüssung */}
      <View style={styles.center}>
        <View style={styles.iconCircle}>
          <Icon family="mci" name={BIOMETRIC_ICON} size={44} color={colors.accent} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          Willkommen zurück
        </Text>
        <Text style={styles.subtitle}>Entsperre Spendly, um deine Ausgaben zu sehen.</Text>
      </View>

      {/* Unten in der Daumenzone: Aktionen */}
      <View style={styles.actions}>
        <Button title={BIOMETRIC_LABEL} icon={BIOMETRIC_ICON} iconFamily="mci" onPress={unlock} />
        <Button title="Code verwenden" variant="text" size="medium" onPress={unlock} />
        <View style={styles.privacy}>
          <Icon name="lock" size={14} color={colors.textSecondary} />
          <Text style={styles.privacyText}>{PRIVACY_TEXT}</Text>
        </View>
      </View>
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
    title: {
      ...typography.headlineMd,
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.bodyLg,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 280,
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
  });
}
