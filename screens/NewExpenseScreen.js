// Screen 3 · Neue Ausgabe (Modal) – wird auch zum Bearbeiten verwendet.
// Die Eingaben werden in Echtzeit geprüft (utils/validation.js).
// "Speichern" bleibt gesperrt, solange etwas fehlt oder falsch ist.
import { useEffect, useMemo, useState } from 'react';
import { usePreventRemove } from '@react-navigation/native';
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
import EmptyState from '../components/EmptyState';
import FieldError from '../components/FieldError';
import Icon from '../components/Icon';
import Pill from '../components/Pill';
import { CATEGORIES } from '../utils/categories';
import { getBudgetStatus } from '../utils/budget';
import { formatCHF, formatLongDate, parseAmountToRappen, parseISODate, toISODate } from '../utils/format';
import { MAX_DESCRIPTION_LENGTH, validateExpense } from '../utils/validation';
import { useData } from '../storage/DataContext';

// Screen «Neue Ausgabe» bzw. «Ausgabe bearbeiten» (als Modal).
// route.params enthält die Werte, die beim Öffnen mitgegeben wurden.
export default function NewExpenseScreen({ navigation, route }) {
  // Farben holen (hell oder dunkel, je nach Einstellung)
  const { colors, isDark } = useTheme();
  // Styles mit diesen Farben bauen. useMemo: nur neu, wenn sich die Farben ändern.
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    expenses,
    settings,
    budgetRappen,
    spentRappen,
    createExpense,
    editExpense,
    removeExpense,
    showSnackbar,
  } = useData();

  // Mit expenseId wird eine bestehende Ausgabe bearbeitet
  const expenseId = route.params?.expenseId;
  const isEditMode = Boolean(expenseId);
  // Die Ausgabe, die bearbeitet wird (oder null bei einer neuen)
  const existing = isEditMode ? expenses.find((expense) => expense.id === expenseId) : null;

  // Heutiges Datum: Obergrenze fürs Datum und Startwert im Formular
  const today = new Date();

  // Startwerte: beim Bearbeiten aus der Ausgabe, sonst leer bzw. heute
  // Jedes Feld hat seinen eigenen State. Der Betrag bleibt Text (z. B. '12,5'),
  // solange getippt wird – in Rappen umgerechnet wird erst beim Speichern.
  const [amountText, setAmountText] = useState(
    existing ? (existing.amountRappen / 100).toFixed(2) : ''
  );
  const [categoryId, setCategoryId] = useState(
    existing ? existing.category : settings.lastCategory
  );
  const [description, setDescription] = useState(existing ? existing.description : '');
  const [date, setDate] = useState(existing ? existing.date : toISODate(today));
  // Ist der Kalender gerade offen?
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Wurde im Betragsfeld schon etwas getippt? (für die Fehleranzeige)
  const [amountTouched, setAmountTouched] = useState(false);
  // true, während gespeichert wird – verhindert doppeltes Speichern
  const [saving, setSaving] = useState(false);
  const [allowExit, setAllowExit] = useState(false);
  const [initial] = useState(() => ({
    amountText: existing ? (existing.amountRappen / 100).toFixed(2) : '',
    categoryId: existing ? existing.category : settings.lastCategory,
    description: existing ? existing.description : '',
    date: existing ? existing.date : toISODate(today),
  }));
  const dirty = amountText !== initial.amountText || categoryId !== initial.categoryId || description !== initial.description || date !== initial.date;

  // Gilt auch für Android-Zurück und die Wischgeste des nativen Modals.
  // Die Sicherheitssperre darf dabei nie durch ein Formular blockiert werden.
  usePreventRemove((dirty || saving) && !allowExit, ({ data }) => {
    if (data.action.type === 'RESET' && data.action.payload?.routes?.[0]?.name === 'Lock') {
      navigation.dispatch(data.action);
      return;
    }
    if (saving) return;
    Alert.alert('Änderungen verwerfen?', 'Deine Eingaben sind noch nicht gespeichert.', [
      { text: 'Weiter bearbeiten', style: 'cancel' },
      { text: 'Verwerfen', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  useEffect(() => {
    if (allowExit) navigation.goBack();
  }, [allowExit, navigation]);

  // Bei jedem Neuzeichnen (also bei jedem Tastendruck) das ganze Formular prüfen.
  // errors enthält pro Feld einen Fehlertext oder null.
  const { errors, isValid } = validateExpense(
    { amountText, categoryId, description, date },
    today
  );

  // Fehler erst zeigen, wenn im Feld schon etwas getippt wurde –
  // ein leeres Formular soll nicht sofort rot sein.
  const amountError = amountTouched ? errors.amount : null;
  // Der Kategorie-Hinweis erscheint, sobald ein Betrag getippt wurde
  const categoryError = amountTouched ? errors.category : null;

  // "Heute noch frei" – hilft beim Einordnen des Betrags
  const status = getBudgetStatus(budgetRappen, spentRappen, today);

  // Modal schliessen und zum vorherigen Screen zurück
  function close() {
    navigation.goBack();
  }

  // Wird aufgerufen, wenn im Kalender ein Datum gewählt wird
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

  // Löschen direkt aus dem Bearbeiten heraus. Das ist auch der Weg für alle,
  // die nicht wischen können. Die Snackbar erlaubt 5 s lang "Rückgängig".
  async function handleDelete() {
    if (saving) return;
    const expense = existing;
    setSaving(true);
    try {
      await removeExpense(expense);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setAllowExit(true);
    } catch (error) {
      console.warn('Ausgabe konnte nicht gelöscht werden:', error);
      Alert.alert('Nicht gelöscht', 'Die Ausgabe konnte nicht gelöscht werden.');
    } finally {
      setSaving(false);
    }
  }

  // «Speichern» wurde getippt: Ausgabe in die Datenbank schreiben und das Modal schliessen
  async function handleSave() {
    // Sicherheitshalber: nie speichern, wenn etwas ungültig ist oder schon gespeichert wird
    if (!isValid || saving) return;

    setSaving(true);
    try {
      // Aus den Feldern ein Ausgaben-Objekt bauen. Der Betrag wird hier
      // von Text in ganze Rappen umgerechnet ('12,50' -> 1250).
      const input = {
        amountRappen: parseAmountToRappen(amountText),
        category: categoryId,
        description: description.trim(),
        date,
      };

      // Bearbeiten ändert die bestehende Zeile, sonst kommt eine neue dazu
      if (isEditMode) {
        await editExpense(expenseId, input);
      } else {
        await createExpense(input);
      }

      // Kurze Rückmeldung, dass es geklappt hat
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showSnackbar({ message: 'Gespeichert' });
      setAllowExit(true);
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

  // Die Ausgabe gibt es nicht mehr (z. B. inzwischen gelöscht)
  if (isEditMode && !existing && !saving && !allowExit) {
    return (
      <SafeAreaView style={[styles.screen, styles.notFound]}>
        <EmptyState
          icon="file-minus"
          title="Ausgabe nicht gefunden"
          description="Diese Ausgabe wurde inzwischen gelöscht."
          actionLabel="Schliessen"
          onAction={close}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* KeyboardAvoidingView schiebt den Inhalt nach oben, wenn die Tastatur
         aufgeht – so bleibt der Speichern-Button sichtbar (nur iOS nötig). */}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Kopfzeile in drei Spalten: Abbrechen | Titel | leer.
            Die beiden Seiten sind gleich breit, dadurch steht der Titel in
            der Mitte und bekommt nur den Platz dazwischen – er kann
            "Abbrechen" also nie überdecken (auch nicht bei grosser Schrift). */}
        <View style={styles.topBar}>
          <View style={styles.topBarSide}>
            <Pressable
                  onPress={close}
                  disabled={saving}
              accessibilityRole="button"
              style={({ pressed }) => [styles.cancel, pressed && styles.cancelPressed]}
            >
              <Text style={styles.cancelText} numberOfLines={1}>
                Abbrechen
              </Text>
            </Pressable>
          </View>
          <Text
            style={styles.title}
            accessibilityRole="header"
            numberOfLines={1}
            // Wird es trotzdem eng, wird der Titel etwas kleiner statt abgeschnitten
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {isEditMode ? 'Ausgabe bearbeiten' : 'Neue Ausgabe'}
          </Text>
          <View style={styles.topBarSide} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Betrag: gross, Zahlentastatur öffnet automatisch */}
          <View style={styles.amountBlock}>
            <Text style={styles.overline}>Betrag eingeben</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currency}>CHF</Text>
              <TextInput
                // Kontrolliertes Feld: Der Wert kommt aus dem State,
                // jede Eingabe landet über onChangeText wieder im State.
                value={amountText}
                onChangeText={(text) => {
                  setAmountText(text);
                  setAmountTouched(true);
                }}
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
                // Zahlentastatur mit Komma bzw. Punkt
                keyboardType="decimal-pad"
                // Tastatur öffnet sich sofort, man kann direkt lostippen
                autoFocus
                // Reicht bis CHF 9'999'999.99 – mehr passt nicht auf den Bildschirm
                maxLength={10}
                style={[styles.amountInput, amountError && styles.amountInputError]}
                accessibilityLabel="Betrag in Franken"
              />
            </View>
            {/* Entweder die Fehlermeldung – oder als Hilfe «Heute noch frei» */}
            {amountError ? (
              <FieldError message={amountError} align="center" />
            ) : (
              <Pill
                label={
                  budgetRappen == null ? 'Noch kein Monatsbudget festgelegt' : status.isOverBudget
                    ? `Budget überschritten um ${formatCHF(status.overByRappen)}`
                    : `Heute noch frei: ${formatCHF(status.dailyAllowanceRappen)}`
                }
                tone={budgetRappen != null && status.isOverBudget ? 'danger' : 'accent'}
              />
            )}
          </View>

          {/* Kategorie – Fehler rechts neben dem Label wie im Mockup */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>Kategorie</Text>
            <FieldError message={categoryError} style={styles.labelError} />
          </View>
          <View style={styles.chips}>
            {CATEGORIES.map((category) => (
              <Chip
                key={category.id}
                label={category.label}
                dotColor={category.color}
                // Der Chip ist gewählt, wenn seine id im State steht
                selected={categoryId === category.id}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
          </View>

          {/* Beschreibung (optional) */}
          <View style={[styles.field, errors.description && styles.fieldError]}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Beschreibung (optional)</Text>
              {/* Zähler «25/40» erst ab 20 Zeichen, damit das Feld sonst ruhig bleibt */}
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
          <FieldError message={errors.description} style={styles.errorUnderField} />

          {/* Datum – nie in der Zukunft */}
          <Pressable
            // Tippen öffnet den Kalender, nochmals tippen schliesst ihn wieder
            onPress={() => setShowDatePicker((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={`Datum: ${formatLongDate(date, today)}`}
            accessibilityHint="Öffnet die Datumsauswahl"
            style={({ pressed }) => [
              styles.field,
              styles.dateField,
              errors.date && styles.fieldError,
              pressed && styles.fieldPressed,
            ]}
          >
            <View>
              <Text style={styles.fieldLabel}>Datum</Text>
              <Text style={styles.fieldValue}>{formatLongDate(date, today)}</Text>
            </View>
            <Icon name="calendar" size={20} color={colors.textSecondary} />
          </Pressable>
          <FieldError message={errors.date} style={styles.errorUnderField} />

          {/* Kalender nur zeigen, wenn er geöffnet wurde */}
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
              {/* Auf iOS bleibt der Kalender im Screen offen, darum ein «Fertig»-Button */}
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

          {/* Beim Bearbeiten: Löschen als eigene, rote Aktion ganz unten */}
          {isEditMode && (
            <Button
              title="Ausgabe löschen"
              variant="destructive"
              size="medium"
              icon="trash-2"
              onPress={handleDelete}
              disabled={saving}
              accessibilityHint="Kann danach 5 Sekunden lang rückgängig gemacht werden"
              style={styles.deleteButton}
            />
          )}
        </ScrollView>

        {/* Speichern-Button unten in der Daumenzone */}
        <View style={styles.footer}>
          <Button
            title={isEditMode ? 'Änderungen speichern' : 'Ausgabe speichern'}
            icon="arrow-right"
            iconPosition="right"
            onPress={handleSave}
            // Grau und nicht tippbar, solange etwas fehlt oder gerade gespeichert wird
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

// Alle Styles dieses Screens. Als Funktion, weil sie die aktuellen Farben brauchen.
function createStyles(colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // Füllt den ganzen freien Platz
    flex: { flex: 1 },
    // Kopfzeile in drei Spalten: Abbrechen | Titel | leer
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
    // Gedrückt: «Abbrechen» wird kurz grau
    cancelPressed: { backgroundColor: colors.pressed },
    // «Abbrechen» in Grün
    cancelText: {
      ...typography.bodyLg,
      color: colors.accent,
    },
    // Linke und rechte Spalte gleich breit (mindestens so breit wie "Abbrechen")
    // minWidth statt width: Bei grosser Systemschrift darf "Abbrechen" wachsen
    topBarSide: {
      minWidth: 116,
      alignItems: 'flex-start',
    },
    // Titel in der Mitte der Kopfzeile
    title: {
      ...typography.headlineSm,
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    // Seitenränder des scrollbaren Inhalts
    content: {
      paddingHorizontal: spacing.screen,
      paddingBottom: spacing.lg,
    },
    // Betragsbereich: alles mittig untereinander
    amountBlock: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.lg,
    },
    // Kleine Überschrift in Grossbuchstaben
    overline: {
      ...typography.labelSm,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    // «CHF» und der Betrag stehen auf einer Grundlinie
    amountRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    // Das Wort «CHF» vor dem Betrag
    currency: {
      ...typography.bodyLg,
      color: colors.textSecondary,
    },
    amountInput: {
      ...typography.currencyHero,
      color: colors.text,
      minWidth: 120,
      padding: 0,
      // Unsichtbare Linie, damit beim Fehler nichts verrutscht
      borderBottomWidth: 1.5,
      borderBottomColor: 'transparent',
    },
    // Rote Linie zusätzlich zur Meldung (nie Farbe allein)
    amountInputError: { borderBottomColor: colors.danger },
    // «Kategorie» links, Fehlermeldung rechts
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    // Beschriftung über einer Gruppe
    label: {
      ...typography.labelMd,
      color: colors.textSecondary,
    },
    // Lange Fehlertexte brechen um
    labelError: { flexShrink: 1 },
    // Die Fehlermeldung rückt näher an das Feld darüber
    errorUnderField: {
      marginTop: -spacing.sm,
      marginBottom: spacing.md,
    },
    // Kategorie-Chips: mehrere pro Zeile, sie brechen in die nächste Zeile um
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    // Eingabefeld: Rahmen, weisse Fläche, mindestens 64 pt hoch
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
    // Gedrückt: Feld wird kurz grau
    fieldPressed: { backgroundColor: colors.pressed },
    // Bei einem Fehler: roter, dickerer Rahmen (zusätzlich zum Text)
    fieldError: { borderColor: colors.danger, borderWidth: 1.5 },
    // Datumsfeld: Text links, Kalender-Icon rechts
    dateField: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    // Label links, Zeichenzähler rechts
    fieldLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    // Kleine Beschriftung im Feld
    fieldLabel: {
      ...typography.labelSm,
      color: colors.textSecondary,
    },
    // Zeichenzähler, z. B. «25/40»
    counter: {
      ...typography.labelSm,
      // textSecondary statt textTertiary: sonst unter 4.5:1 Kontrast
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    // Der getippte Text im Feld
    fieldInput: {
      ...typography.bodyLg,
      color: colors.text,
      minHeight: 32,
      padding: 0,
    },
    // Der angezeigte Wert im Datumsfeld
    fieldValue: {
      ...typography.bodyLg,
      color: colors.text,
    },
    // Rahmen um den Kalender
    pickerBox: {
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: spacing.sm,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    // Abstand über dem Löschen-Button
    deleteButton: { marginTop: spacing.sm },
    // Hinweis «Ausgabe nicht gefunden» steht in der Mitte
    notFound: { justifyContent: 'center', paddingHorizontal: spacing.screen },
    // Speichern-Button unten in der Daumenzone
    footer: {
      paddingHorizontal: spacing.screen,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
  });
}
