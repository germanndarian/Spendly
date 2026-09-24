// Screen 5 · Einstellungen (Tab)
// Alle Werte kommen aus der Datenbank und gelten auch nach einem Neustart.
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import ChangeCodeModal from '../components/ChangeCodeModal';
import Chip from '../components/Chip';
import PromptModal from '../components/PromptModal';
import ScreenHeader from '../components/ScreenHeader';
import SettingsRow from '../components/SettingsRow';
import SettingsSection from '../components/SettingsSection';
import { lockApp } from '../navigation/navigationRef';
import { useData } from '../storage/DataContext';
import { createDemoExpenses } from '../data/demoData';
import { formatCHF, parseAmountToRappen } from '../utils/format';
import { validateBudget } from '../utils/validation';
import { BIOMETRIC_NAME, checkBiometrics, getUnavailableText, UNLOCK_LABEL } from '../utils/biometrics';

// Auswahl für das Erscheinungsbild
const APPEARANCE_OPTIONS = [
  { id: 'light', label: 'Hell' },
  { id: 'dark', label: 'Dunkel' },
  { id: 'system', label: 'System' },
];

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { settings, budgetRappen, updateSetting, deleteAllData, loadDemoData } = useData();

  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  // Steht Face ID / Fingerabdruck auf diesem Gerät zur Verfügung?
  const [biometry, setBiometry] = useState({ available: true, reason: null });

  useEffect(() => {
    let active = true;
    checkBiometrics().then((result) => {
      if (active) setBiometry(result);
    });
    return () => {
      active = false;
    };
  }, []);

  // Speichert eine Einstellung und meldet sich, wenn das nicht klappt
  function changeSetting(key, value) {
    updateSetting(key, value).catch((error) => {
      console.warn('Einstellung konnte nicht gespeichert werden:', error);
      Alert.alert('Nicht gespeichert', 'Die Einstellung konnte nicht gespeichert werden.');
    });
  }

  function handleSaveBudget(text) {
    changeSetting('budgetRappen', parseAmountToRappen(text));
    setBudgetModalVisible(false);
  }

  function handleDeleteAll() {
    Alert.alert(
      'Alle Daten löschen?',
      'Alle Ausgaben, Einstellungen und dein Code werden unwiderruflich von diesem Gerät gelöscht.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Alle Daten löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllData();
              // Ohne Code beginnt die App wieder mit "Code festlegen"
              lockApp();
            } catch (error) {
              console.warn('Daten konnten nicht gelöscht werden:', error);
              Alert.alert('Nicht gelöscht', 'Die Daten konnten nicht gelöscht werden.');
            }
          },
        },
      ]
    );
  }

  async function handleDemoData() {
    try {
      await loadDemoData(createDemoExpenses());
    } catch (error) {
      console.warn('Demo-Daten konnten nicht geladen werden:', error);
      Alert.alert('Nicht geladen', 'Die Demo-Daten konnten nicht geladen werden.');
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Einstellungen" />

        <SettingsSection title="Budget">
          <SettingsRow
            icon="credit-card"
            label="Monatsbudget"
            value={formatCHF(budgetRappen)}
            onPress={() => setBudgetModalVisible(true)}
            isLast
          />
        </SettingsSection>

        <SettingsSection
          title="Sicherheit"
          footer={biometry.available ? undefined : getUnavailableText(biometry.reason)}
        >
          <SettingsRow
            icon="smile"
            label={UNLOCK_LABEL}
            hint={biometry.available ? undefined : `${BIOMETRIC_NAME} steht hier nicht zur Verfügung`}
            switchValue={settings.biometricEnabled}
            onSwitchChange={(value) => changeSetting('biometricEnabled', value)}
            disabled={!biometry.available}
          />
          <SettingsRow
            icon="clock"
            label="Automatisch sperren"
            hint="Nach 1 Minute im Hintergrund"
            switchValue={settings.autoLockEnabled}
            onSwitchChange={(value) => changeSetting('autoLockEnabled', value)}
          />
          <SettingsRow icon="hash" label="Code ändern" onPress={() => setCodeModalVisible(true)} />
          <SettingsRow
            icon="lock"
            label="App jetzt sperren"
            onPress={lockApp}
            accessibilityHint="Zurück zum Entsperren-Bildschirm"
            isLast
          />
        </SettingsSection>

        {/* Erscheinungsbild: drei Chips statt eines Dialogs –
            so sieht man die Auswahl sofort und braucht nur einen Tipp */}
        <SettingsSection title="Darstellung">
          <View style={styles.appearanceRow}>
            {APPEARANCE_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                label={option.label}
                selected={mode === option.id}
                onPress={() => setMode(option.id)}
              />
            ))}
          </View>
        </SettingsSection>

        {/* Einzige destruktive Aktion: eigene Gruppe, rot, mit Icon und Text */}
        <SettingsSection footer="Löscht alle Ausgaben unwiderruflich von diesem Gerät.">
          <SettingsRow icon="trash-2" label="Alle Daten löschen" destructive onPress={handleDeleteAll} isLast />
        </SettingsSection>

        {/* Nur im Entwicklungsmodus sichtbar – für die Live-Demo */}
        {__DEV__ && (
          <SettingsSection title="Entwicklung">
            <SettingsRow
              icon="database"
              label="Demo-Daten laden"
              hint="Rund 40 Beispiel-Ausgaben"
              onPress={handleDemoData}
              isLast
            />
          </SettingsSection>
        )}

        <Text style={styles.version}>Spendly 1.0</Text>
      </ScrollView>

      <PromptModal
        visible={budgetModalVisible}
        title="Monatsbudget"
        description="Wie viel möchtest du pro Monat ausgeben?"
        initialValue={(budgetRappen / 100).toFixed(2)}
        prefix="CHF"
        keyboardType="decimal-pad"
        validate={validateBudget}
        onCancel={() => setBudgetModalVisible(false)}
        onSave={handleSaveBudget}
      />

      <ChangeCodeModal
        visible={codeModalVisible}
        onCancel={() => setCodeModalVisible(false)}
        onDone={() => {
          setCodeModalVisible(false);
          Alert.alert('Code geändert', 'Beim nächsten Entsperren gilt der neue Code.');
        }}
      />
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
    appearanceRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      padding: spacing.md,
    },
    version: {
      ...typography.labelSm,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
  });
}
