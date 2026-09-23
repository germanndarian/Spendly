// Screen 5 · Einstellungen (Tab)
// Phase 1: statische Werte. "App jetzt sperren" funktioniert schon,
// die anderen Aktionen folgen in den nächsten Phasen.
import { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import ScreenHeader from '../components/ScreenHeader';
import SettingsRow from '../components/SettingsRow';
import SettingsSection from '../components/SettingsSection';
import { lockApp } from '../navigation/navigationRef';
import { formatCHF } from '../utils/format';

const BIOMETRIC_LABEL = Platform.OS === 'android' ? 'Mit Fingerabdruck entsperren' : 'Mit Face ID entsperren';

// Platzhalter für Funktionen, die in einer späteren Phase gebaut werden
function showComingSoon() {
  Alert.alert('Noch nicht verfügbar', 'Diese Funktion folgt in einer späteren Phase.');
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Phase 1: Schalter nur im Speicher (ab Phase 2 in AsyncStorage)
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Einstellungen" />

        <SettingsSection title="Budget">
          <SettingsRow
            icon="credit-card"
            label="Monatsbudget"
            value={formatCHF(80000)}
            onPress={showComingSoon}
            isLast
          />
        </SettingsSection>

        <SettingsSection title="Sicherheit">
          <SettingsRow
            icon="smile"
            label={BIOMETRIC_LABEL}
            switchValue={biometricEnabled}
            onSwitchChange={setBiometricEnabled}
          />
          <SettingsRow
            icon="clock"
            label="Automatisch sperren"
            hint="Nach 1 Minute im Hintergrund"
            switchValue={autoLockEnabled}
            onSwitchChange={setAutoLockEnabled}
          />
          <SettingsRow icon="hash" label="Code ändern" onPress={showComingSoon} />
          <SettingsRow
            icon="lock"
            label="App jetzt sperren"
            onPress={lockApp}
            accessibilityHint="Zurück zum Entsperren-Bildschirm"
            isLast
          />
        </SettingsSection>

        <SettingsSection title="Darstellung">
          <SettingsRow icon="sun" label="Erscheinungsbild" value="System" onPress={showComingSoon} isLast />
        </SettingsSection>

        {/* Einzige destruktive Aktion: eigene Gruppe, rot, mit Icon und Text */}
        <SettingsSection footer="Löscht alle Ausgaben unwiderruflich von diesem Gerät.">
          <SettingsRow icon="trash-2" label="Alle Daten löschen" destructive onPress={showComingSoon} isLast />
        </SettingsSection>

        {/* Nur im Entwicklungsmodus sichtbar – für die Live-Demo */}
        {__DEV__ && (
          <SettingsSection title="Entwicklung">
            <SettingsRow
              icon="database"
              label="Demo-Daten laden"
              hint="Rund 40 Beispiel-Ausgaben"
              onPress={showComingSoon}
              isLast
            />
          </SettingsSection>
        )}

        <Text style={styles.version}>Spendly 1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: spacing.screen,
      paddingBottom: spacing.xl,
    },
    version: {
      ...typography.labelSm,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
  });
}
