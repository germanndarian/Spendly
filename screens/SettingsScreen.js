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
import ChoiceModal from '../components/ChoiceModal';
import BudgetModal from '../components/BudgetModal';
import ScreenHeader from '../components/ScreenHeader';
import SettingsRow from '../components/SettingsRow';
import SettingsSection from '../components/SettingsSection';
import { lockApp } from '../navigation/navigationRef';
import { useData } from '../storage/DataContext';
import { createDemoExpenses } from '../data/demoData';
import { formatCHF, formatMonthYear, parseISODate } from '../utils/format';
import { AUTO_LOCK_OPTIONS, getAutoLockLabel } from '../utils/autoLock';
import { checkBiometrics, getUnavailableText } from '../utils/biometrics';

// Auswahl für das Erscheinungsbild
const APPEARANCE_OPTIONS = [
  { id: 'light', label: 'Hell' },
  { id: 'dark', label: 'Dunkel' },
  { id: 'system', label: 'System' },
];

// Screen «Einstellungen»
export default function SettingsScreen() {
  // Farben und das gewählte Erscheinungsbild (mode) aus dem Theme
  const { colors, mode, setMode } = useTheme();
  // Styles mit diesen Farben bauen. useMemo: nur neu, wenn sich die Farben ändern.
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { expenses, settings, budgetRappen, currentMonth, budgetHistory, updateMonthBudget, updateSetting, deleteAllData, loadDemoData, showSnackbar } =
    useData();

  // Welcher Dialog ist gerade offen? (true = sichtbar)
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [lockModalVisible, setLockModalVisible] = useState(false);
  // Steht Face ID / Fingerabdruck auf diesem Gerät zur Verfügung?
  const [biometry, setBiometry] = useState({ available: false, reason: null });
  const biometricName = biometry.name ?? 'Biometrie';
  const unlockLabel = biometry.unlockLabel ?? 'Mit Biometrie entsperren';

  // Beim Öffnen einmal prüfen, ob Face ID geht. [] heisst: nur ein Mal.
  useEffect(() => {
    let active = true;
    checkBiometrics().then((result) => {
      // Nur übernehmen, wenn der Screen noch offen ist
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

  // «Alle Daten löschen»: zuerst eine Sicherheitsfrage (Alert mit zwei Buttons)
  function handleDeleteAll() {
    // Die Anzahl macht greifbar, was verloren geht
    const count = expenses.length === 1 ? '1 Ausgabe' : `${expenses.length} Ausgaben`;
    Alert.alert(
      'Alle Daten löschen?',
      `${count}, deine Einstellungen und dein Code werden von diesem Gerät gelöscht. Das kann nicht rückgängig gemacht werden.`,
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

  // Nur für die Präsentation: Beispiel-Ausgaben erzeugen und speichern
  async function handleDemoData() {
    try {
      const demoExpenses = createDemoExpenses();
      await loadDemoData(demoExpenses);
      showSnackbar({ message: `${demoExpenses.length} Demo-Ausgaben geladen` });
    } catch (error) {
      console.warn('Demo-Daten konnten nicht geladen werden:', error);
      Alert.alert('Nicht geladen', 'Die Demo-Daten konnten nicht geladen werden.');
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Einstellungen" />

        {/* Jede SettingsSection ist eine Gruppe mit Überschrift und weisser Karte */}
        <SettingsSection title="Budget">
          <SettingsRow
            icon="credit-card"
            label="Monatsbudget"
            value={budgetRappen == null ? 'Festlegen' : formatCHF(budgetRappen)}
            hint={`${formatMonthYear(parseISODate(`${currentMonth}-01`))} · weitere Monate im Dialog`}
            onPress={() => setBudgetModalVisible(true)}
            isLast
          />
        </SettingsSection>

        <SettingsSection
          title="Sicherheit"
          // Hinweis unter der Gruppe, falls Face ID hier nicht geht
          footer={biometry.available ? undefined : getUnavailableText(biometry.reason, biometricName)}
        >
          <SettingsRow
            icon="smile"
            label={unlockLabel}
            hint={biometry.available ? undefined : `${biometricName} steht hier nicht zur Verfügung`}
            // Ohne Face ID steht der Schalter auf "aus", auch wenn er gespeichert "an" ist
            switchValue={biometry.available && settings.biometricEnabled}
            // Schalter umgelegt -> neuen Wert sofort speichern
            onSwitchChange={(value) => changeSetting('biometricEnabled', value)}
            disabled={!biometry.available}
          />
          {/* Sperrzeit wählbar statt nur an/aus (Konzept: Individualisierbarkeit) */}
          <SettingsRow
            icon="clock"
            label="Automatisch sperren"
            value={getAutoLockLabel(settings.autoLockMinutes)}
            onPress={() => setLockModalVisible(true)}
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
                // Gewählt ist der Chip, dessen id dem aktuellen Erscheinungsbild entspricht
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
        {/* __DEV__ ist nur beim Entwickeln true – in der fertigen App fehlt dieser Teil */}
        {__DEV__ && (
          <SettingsSection title="Entwicklung">
            <SettingsRow
              icon="database"
              label="Demo-Daten laden"
              hint="Rund 40 Beispiel-Ausgaben der letzten 30 Tage"
              onPress={handleDemoData}
              isLast
            />
          </SettingsSection>
        )}

        <Text style={styles.version}>Spendly 1.0</Text>
      </ScrollView>

      {/* Die Dialoge liegen ausserhalb der ScrollView. «visible» steuert, ob sie offen sind. */}
      {budgetModalVisible && <BudgetModal
        currentMonth={currentMonth}
        history={budgetHistory}
        defaultBudgetRappen={settings.defaultBudgetRappen}
        onCancel={() => setBudgetModalVisible(false)}
        onSave={updateMonthBudget}
      />}

      <ChoiceModal
        visible={lockModalVisible}
        title="Automatisch sperren"
        description="Wie lange darf Spendly im Hintergrund sein, bevor es sich sperrt?"
        // Aus der Liste der Sperrzeiten die Auswahl für den Dialog bauen
        options={AUTO_LOCK_OPTIONS.map((option) => ({ key: option.minutes, label: option.label }))}
        selectedKey={settings.autoLockMinutes}
        onSelect={(minutes) => {
          changeSetting('autoLockMinutes', minutes);
          setLockModalVisible(false);
        }}
        onCancel={() => setLockModalVisible(false)}
      />

      <ChangeCodeModal
        visible={codeModalVisible}
        onCancel={() => setCodeModalVisible(false)}
        onDone={() => {
          setCodeModalVisible(false);
          showSnackbar({ message: 'Code geändert' });
        }}
      />
    </SafeAreaView>
  );
}

// Alle Styles dieses Screens. Als Funktion, weil sie die aktuellen Farben brauchen.
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
