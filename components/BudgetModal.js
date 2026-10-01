// Monatsbudgets bearbeiten, ohne ältere Monate durch eine neue Vorgabe zu verändern.
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';
import { formatCHF, formatMonthYear, parseAmountToRappen, parseISODate, toISODate } from '../utils/format';
import { validateBudget } from '../utils/validation';
import Button from './Button';
import FieldError from './FieldError';
import Icon from './Icon';

// Props: currentMonth = aktueller Monat ('2026-10'), history = alle Monate mit Budget und Ausgaben,
// defaultBudgetRappen = Vorgabe für neue Monate, onSave = speichern, onCancel = schliessen
export default function BudgetModal({ currentMonth, history, defaultBudgetRappen, onSave, onCancel }) {
  // Aktuelle Farben holen (hell oder dunkel, je nach Einstellung)
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Welcher Monat wird gerade bearbeitet? Am Anfang der aktuelle.
  const [month, setMonth] = useState(currentMonth);
  // Budget des aktuellen Monats als Startwert (leer, wenn es noch keines gibt)
  const initialBudget = history.find((entry) => entry.month === currentMonth)?.budgetRappen;
  // Der Text im Betragsfeld, z. B. '800.00'
  const [amount, setAmount] = useState(initialBudget == null ? '' : (initialBudget / 100).toFixed(2));
  // Schalter: Betrag auch für kommende Monate übernehmen?
  const [useForFuture, setUseForFuture] = useState(false);
  // true, während gespeichert wird (verhindert doppeltes Speichern)
  const [saving, setSaving] = useState(false);
  // Zahlen des gewählten Monats (Budget und Ausgaben)
  const entry = history.find((item) => item.month === month);
  // Der Betrag wird bei jeder Eingabe geprüft (gleiche Regeln wie bisher)
  const error = validateBudget(amount);
  // Monat als Text, z. B. «Oktober 2026»
  const monthLabel = formatMonthYear(parseISODate(`${month}-01`));

  // Einen Monat vor (+1) oder zurück (-1) wechseln und dessen Budget ins Feld laden
  function moveMonth(direction) {
    const date = parseISODate(`${month}-01`);
    date.setMonth(date.getMonth() + direction);
    const nextMonth = toISODate(date).slice(0, 7);
    const nextBudget = history.find((item) => item.month === nextMonth)?.budgetRappen;
    setMonth(nextMonth);
    setAmount(nextBudget == null ? '' : (nextBudget / 100).toFixed(2));
    setUseForFuture(false);
  }

  // Speichern: Eingabe prüfen, an den Screen weitergeben und danach den Dialog schliessen
  async function save() {
    // Nie speichern, wenn der Betrag ungültig ist oder schon gespeichert wird
    if (error || saving) return;
    setSaving(true);
    try {
      await onSave(month, parseAmountToRappen(amount), useForFuture);
      onCancel();
    } catch (saveError) {
      console.warn('Budget konnte nicht gespeichert werden:', saveError);
      Alert.alert('Nicht gespeichert', 'Dein bisheriges Budget bleibt erhalten. Versuche es nochmals.');
    } finally {
      setSaving(false);
    }
  }

  return (
    // Die Zurück-Taste (Android) schliesst den Dialog, ausser während des Speicherns
    <Modal transparent animationType="fade" onRequestClose={saving ? undefined : onCancel}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title} accessibilityRole="header">Monatsbudget</Text>
            {/* Monatswahl: Pfeil zurück, Monatsname, Pfeil vor */}
            <View style={styles.monthRow}>
              <Pressable accessibilityRole="button" accessibilityLabel="Vorheriger Monat" onPress={() => moveMonth(-1)} disabled={saving} style={styles.arrow}>
                <Icon name="chevron-left" size={22} color={colors.accent} />
              </Pressable>
              <Text style={styles.month} accessibilityRole="header">{monthLabel}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Nächster Monat" onPress={() => moveMonth(1)} disabled={saving} style={styles.arrow}>
                <Icon name="chevron-right" size={22} color={colors.accent} />
              </Pressable>
            </View>
            {/* Zahlen des Monats: ausgegeben und Restbudget */}
            <Text style={styles.caption}>Ausgegeben: {formatCHF(entry?.spentRappen ?? 0)}</Text>
            {entry?.budgetRappen != null ? (
              <Text style={styles.caption}>Restbudget: {formatCHF(entry.budgetRappen - entry.spentRappen)}</Text>
            ) : <Text style={styles.caption}>Für diesen Monat ist noch kein Budget festgelegt.</Text>}
            {/* Betragsfeld mit «CHF» davor */}
            <View style={styles.inputRow}>
              <Text style={styles.body}>CHF</Text>
              <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" selectTextOnFocus editable={!saving}
                maxLength={10} style={styles.input} accessibilityLabel={`Budget für ${monthLabel}`} placeholder="800.00" placeholderTextColor={colors.textTertiary} />
            </View>
            {/* Fehlermeldung erst zeigen, wenn schon etwas getippt wurde */}
            {amount !== '' ? <FieldError message={error} /> : null}
            {/* Schalter: für kommende Monate übernehmen */}
            <View style={styles.futureRow}>
              <Text style={[styles.body, styles.futureLabel]}>Für kommende Monate übernehmen</Text>
              <Switch value={useForFuture} onValueChange={setUseForFuture} disabled={saving} accessibilityLabel="Für kommende Monate übernehmen"
                trackColor={{ false: colors.border, true: colors.primaryButton }} />
            </View>
            <Text style={styles.caption}>
              {defaultBudgetRappen == null ? 'Noch keine Vorgabe für neue Monate.' : `Bisherige Vorgabe: ${formatCHF(defaultBudgetRappen)}.`} Bereits gespeicherte Monatsbudgets bleiben erhalten.
            </Text>
            {/* Abbrechen und Speichern nebeneinander */}
            <View style={styles.actions}>
              <Button title="Abbrechen" variant="secondary" size="medium" disabled={saving} onPress={onCancel} style={styles.action} />
              <Button title={saving ? 'Speichert …' : 'Speichern'} size="medium" disabled={Boolean(error) || saving} onPress={save} style={styles.action} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Alle Styles dieser Komponente. Als Funktion, weil sie die aktuellen Farben brauchen.
function createStyles(colors) {
  return StyleSheet.create({
    // Abgedunkelter Hintergrund, der Dialog steht in der Mitte
    overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screen, backgroundColor: colors.overlay },
    // Weisse Dialog-Karte (höchstens 90 % der Höhe, innen scrollbar)
    card: { width: '100%', maxWidth: 420, maxHeight: '90%', padding: spacing.lg, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    // Titel des Dialogs
    title: { ...typography.headlineSm, color: colors.text },
    // Pfeil, Monatsname und Pfeil nebeneinander
    monthRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.sm },
    // Pfeil-Knopf: 48 × 48 pt, gut tippbar
    arrow: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    // Monatsname in der Mitte
    month: { ...typography.labelMd, color: colors.text, textAlign: 'center', flex: 1 },
    // Kleine graue Zeilen (Ausgaben, Restbudget, Hinweise)
    caption: { ...typography.labelMd, color: colors.textSecondary, marginBottom: spacing.xs },
    // Normaler Text im Dialog
    body: { ...typography.bodyMd, color: colors.text },
    // Betragsfeld mit Rahmen
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.control, paddingHorizontal: spacing.md, marginVertical: spacing.sm },
    // Das Eingabefeld selbst (mindestens 52 pt hoch)
    input: { ...typography.bodyLg, minHeight: 52, flex: 1, color: colors.text },
    // Text links, Schalter rechts
    futureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.sm },
    // Der Text nimmt den freien Platz neben dem Schalter ein
    futureLabel: { flex: 1 },
    // Zwei Buttons nebeneinander
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    // Beide Buttons sind gleich breit
    action: { flex: 1 },
  });
}
