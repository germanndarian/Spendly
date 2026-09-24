// Screen 3 · Neue Ausgabe (Modal) – wird auch zum Bearbeiten verwendet.
// Die Eingaben werden in Echtzeit geprüft (utils/validation.js).
// "Speichern" bleibt gesperrt, solange etwas fehlt oder falsch ist.
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';
import Button from '../components/Button';
import Chip from '../components/Chip';
import Icon from '../components/Icon';
import Pill from '../components/Pill';
import { CATEGORIES } from '../utils/categories';
import { getBudgetStatus } from '../utils/budget';
import { formatCHF, formatLongDate, parseAmountToRappen, parseISODate, toISODate } from '../utils/format';
import { MAX_DESCRIPTION_LENGTH, validateExpense } from '../utils/validation';
import { useData } from '../storage/DataContext';

export default function NewExpenseScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { expenses, settings, budgetRappen, spentRappen, createExpense, editExpense } = useData();

  // Mit expenseId wird eine bestehende Ausgabe bearbeitet
  const expenseId = route.params?.expenseId;
  const isEditMode = Boolean(expenseId);
  const existing = isEditMode ? expenses.find((expense) => expense.id === expenseId) : null;

  const today = new Date();

  // Startwerte: beim Bearbeiten aus der Ausgabe, sonst leer bzw. heute
  const [amountText, setAmountText] = useState(
    existing ? (existing.amountRappen / 100).toFixed(2) : ''
  );
  const [categoryId, setCategoryId] = useState(
    existing ? existing.category : settings.lastCategory
  );
  const [description, setDescription] = useState(existing ? existing.description : '');
  const [date, setDate] = useState(existing ? existing.date : toISODate(today));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const { errors, isValid } = validateExpense(
    { amountText, categoryId, description, date },
    today
  );

  // Fehler erst zeigen, wenn im Feld schon etwas getippt wurde –
  // ein leeres Formular soll nicht sofort rot sein.
  const amountError = amountTouched ? errors.amount : null;
  // Der Kategorie-Hinweis erscheint genau dann, wenn nur noch sie fehlt
  const categoryError = !errors.amount && errors.category ? errors.category : null;

  // "Heute noch frei" – hilft beim Einordnen des Betrags
  const status = getBudgetStatus(budgetRappen, spentRappen, today);

  function close() {
    navigation.goBack();
  }

  function handleDateChange(event, selectedDate) {
    // Android schliesst den Dialog selbst, iOS zeigt den Kalender im Screen
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }
    setDate(toISODate(selectedDate));
  }

  async function handleSave() {
    if (!isValid || saving) return;

    setSaving(true);
    try {
      const input = {
        amountRappen: parseAmountToRappen(amountText),
        category: categoryId,
        description: description.trim(),
        date,
      };

      if (isEditMode) {
        await editExpense(expenseId, input);
      } else {
        await createExpense(input);
      }

      // Kurze Rückmeldung, dass es geklappt hat
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      close();
    } catch (error) {
      console.warn('Ausgabe konnte nicht gespeichert werden:', error);
      Alert.alert(
        'Nicht gespeichert',
        'Die Ausgabe konnte nicht gespeichert werden. Versuche es nochmals.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Kopfzeile: Titel in der Mitte, Abbrechen links */}
        <View style={styles.topBar}>
          <Text style={styles.title} accessibilityRole="header">
            {isEditMode ? 'Ausgabe bearbeiten' : 'Neue Ausgabe'}
          </Text>
          <Pressable
            onPress={close}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cancel, pressed && styles.cancelPressed]}
          >
            <Text style={styles.cancelText}>Abbrechen</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Betrag: gross, Zahlentastatur öffnet automatisch */}
          <View style={styles.amountBlock}>
            <Text style={styles.overline}>Betrag eingeben</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currency}>CHF</Text>
              <TextInput
                value={amountText}
                onChangeText={(text) => {
                  setAmountText(text);
                  setAmountTouched(true);
                }}
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                autoFocus
                style={styles.amountInput}
                accessibilityLabel="Betrag in Franken"
              />
            </View>
            {amountError ? (
              <Text style={styles.error} accessibilityRole="alert">
                {amountError}
              </Text>
            ) : (
              <Pill
                label={
                  status.isOverBudget
                    ? `Budget überschritten um ${formatCHF(status.overByRappen)}`
                    : `Heute noch frei: ${formatCHF(status.dailyAllowanceRappen)}`
                }
                tone={status.isOverBudget ? 'danger' : 'accent'}
              />
            )}
          </View>

          {/* Kategorie */}
          <Text style={styles.label}>Kategorie</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((category) => (
              <Chip
                key={category.id}
                label={category.label}
                dotColor={category.color}
                selected={categoryId === category.id}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
          </View>
          {categoryError ? (
            <Text style={[styles.error, styles.errorUnderChips]} accessibilityRole="alert">
              {categoryError}
            </Text>
          ) : null}

          {/* Beschreibung (optional) */}
          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Beschreibung (optional)</Text>
              {description.length > 20 ? (
                <Text style={styles.counter}>
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </Text>
              ) : null}
            </View>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="z. B. Migros, Znüni"
              placeholderTextColor={colors.textTertiary}
              style={styles.fieldInput}
              returnKeyType="done"
              maxLength={MAX_DESCRIPTION_LENGTH}
              accessibilityLabel="Beschreibung, optional"
            />
          </View>

          {/* Datum – nie in der Zukunft */}
          <Pressable
            onPress={() => setShowDatePicker((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={`Datum: ${formatLongDate(date, today)}`}
            accessibilityHint="Öffnet die Datumsauswahl"
            style={({ pressed }) => [styles.field, styles.dateField, pressed && styles.fieldPressed]}
          >
            <View>
              <Text style={styles.fieldLabel}>Datum</Text>
              <Text style={styles.fieldValue}>{formatLongDate(date, today)}</Text>
            </View>
            <Icon name="calendar" size={20} color={colors.textSecondary} />
          </Pressable>

          {showDatePicker && (
            <View style={styles.pickerBox}>
              <DateTimePicker
                value={parseISODate(date)}
                mode="date"
                // Zukünftige Daten gar nicht erst auswählbar machen
                maximumDate={today}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={handleDateChange}
                accentColor={colors.accent}
                // Der Kalender soll auch dem gewählten Erscheinungsbild folgen
                themeVariant={isDark ? 'dark' : 'light'}
              />
              {Platform.OS === 'ios' && (
                <Button
                  title="Fertig"
                  variant="secondary"
                  size="medium"
                  onPress={() => setShowDatePicker(false)}
                />
              )}
            </View>
          )}
        </ScrollView>

        {/* Speichern-Button unten in der Daumenzone */}
        <View style={styles.footer}>
          <Button
            title={isEditMode ? 'Änderungen speichern' : 'Ausgabe speichern'}
            icon="arrow-right"
            iconPosition="right"
            onPress={handleSave}
            disabled={!isValid || saving}
            accessibilityHint={
              isValid ? undefined : 'Betrag und Kategorie werden noch gebraucht'
            }
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: { flex: 1 },
    topBar: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.xs,
    },
    // "Abbrechen" oben links, wie in iOS üblich (48pt Tippfläche)
    cancel: {
      minHeight: 48,
      justifyContent: 'center',
      paddingHorizontal: 12,
      borderRadius: radius.control,
    },
    cancelPressed: { backgroundColor: colors.pressed },
    cancelText: {
      ...typography.bodyLg,
      color: colors.accent,
    },
    // Titel liegt über der ganzen Breite, damit er genau in der Mitte steht
    title: {
      ...typography.headlineSm,
      color: colors.text,
      position: 'absolute',
      left: 0,
      right: 0,
      textAlign: 'center',
    },
    content: {
      paddingHorizontal: spacing.screen,
      paddingBottom: spacing.lg,
    },
    amountBlock: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.lg,
    },
    overline: {
      ...typography.labelSm,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    currency: {
      ...typography.bodyLg,
      color: colors.textSecondary,
    },
    amountInput: {
      ...typography.currencyHero,
      color: colors.text,
      minWidth: 120,
      padding: 0,
    },
    error: {
      ...typography.labelMd,
      color: colors.danger,
      textAlign: 'center',
    },
    errorUnderChips: {
      textAlign: 'left',
      marginTop: -spacing.sm,
      marginBottom: spacing.md,
    },
    label: {
      ...typography.labelMd,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    field: {
      minHeight: 64,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginBottom: spacing.md,
    },
    fieldPressed: { backgroundColor: colors.pressed },
    dateField: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    fieldLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    fieldLabel: {
      ...typography.labelSm,
      color: colors.textSecondary,
    },
    counter: {
      ...typography.labelSm,
      color: colors.textTertiary,
      fontVariant: ['tabular-nums'],
    },
    fieldInput: {
      ...typography.bodyLg,
      color: colors.text,
      minHeight: 32,
      padding: 0,
    },
    fieldValue: {
      ...typography.bodyLg,
      color: colors.text,
    },
    pickerBox: {
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: spacing.sm,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    footer: {
      paddingHorizontal: spacing.screen,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
  });
}
