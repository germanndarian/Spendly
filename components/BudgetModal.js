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

export default function BudgetModal({ currentMonth, history, defaultBudgetRappen, onSave, onCancel }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [month, setMonth] = useState(currentMonth);
  const initialBudget = history.find((entry) => entry.month === currentMonth)?.budgetRappen;
  const [amount, setAmount] = useState(initialBudget == null ? '' : (initialBudget / 100).toFixed(2));
  const [useForFuture, setUseForFuture] = useState(false);
  const [saving, setSaving] = useState(false);
  const entry = history.find((item) => item.month === month);
  const error = validateBudget(amount);
  const monthLabel = formatMonthYear(parseISODate(`${month}-01`));

  function moveMonth(direction) {
    const date = parseISODate(`${month}-01`);
    date.setMonth(date.getMonth() + direction);
    const nextMonth = toISODate(date).slice(0, 7);
    const nextBudget = history.find((item) => item.month === nextMonth)?.budgetRappen;
    setMonth(nextMonth);
    setAmount(nextBudget == null ? '' : (nextBudget / 100).toFixed(2));
    setUseForFuture(false);
  }

  async function save() {
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
    <Modal transparent animationType="fade" onRequestClose={saving ? undefined : onCancel}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title} accessibilityRole="header">Monatsbudget</Text>
            <View style={styles.monthRow}>
              <Pressable accessibilityRole="button" accessibilityLabel="Vorheriger Monat" onPress={() => moveMonth(-1)} disabled={saving} style={styles.arrow}>
                <Icon name="chevron-left" size={22} color={colors.accent} />
              </Pressable>
              <Text style={styles.month} accessibilityRole="header">{monthLabel}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Nächster Monat" onPress={() => moveMonth(1)} disabled={saving} style={styles.arrow}>
                <Icon name="chevron-right" size={22} color={colors.accent} />
              </Pressable>
            </View>
            <Text style={styles.caption}>Ausgegeben: {formatCHF(entry?.spentRappen ?? 0)}</Text>
            {entry?.budgetRappen != null ? (
              <Text style={styles.caption}>Restbudget: {formatCHF(entry.budgetRappen - entry.spentRappen)}</Text>
            ) : <Text style={styles.caption}>Für diesen Monat ist noch kein Budget festgelegt.</Text>}
            <View style={styles.inputRow}>
              <Text style={styles.body}>CHF</Text>
              <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" selectTextOnFocus editable={!saving}
                maxLength={10} style={styles.input} accessibilityLabel={`Budget für ${monthLabel}`} placeholder="800.00" placeholderTextColor={colors.textTertiary} />
            </View>
            {amount !== '' ? <FieldError message={error} /> : null}
            <View style={styles.futureRow}>
              <Text style={[styles.body, styles.futureLabel]}>Für kommende Monate übernehmen</Text>
              <Switch value={useForFuture} onValueChange={setUseForFuture} disabled={saving} accessibilityLabel="Für kommende Monate übernehmen"
                trackColor={{ false: colors.border, true: colors.primaryButton }} />
            </View>
            <Text style={styles.caption}>
              {defaultBudgetRappen == null ? 'Noch keine Vorgabe für neue Monate.' : `Bisherige Vorgabe: ${formatCHF(defaultBudgetRappen)}.`} Bereits gespeicherte Monatsbudgets bleiben erhalten.
            </Text>
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

function createStyles(colors) {
  return StyleSheet.create({
    overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screen, backgroundColor: colors.overlay },
    card: { width: '100%', maxWidth: 420, maxHeight: '90%', padding: spacing.lg, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    title: { ...typography.headlineSm, color: colors.text },
    monthRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.sm },
    arrow: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    month: { ...typography.labelMd, color: colors.text, textAlign: 'center', flex: 1 },
    caption: { ...typography.labelMd, color: colors.textSecondary, marginBottom: spacing.xs },
    body: { ...typography.bodyMd, color: colors.text },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.control, paddingHorizontal: spacing.md, marginVertical: spacing.sm },
    input: { ...typography.bodyLg, minHeight: 52, flex: 1, color: colors.text },
    futureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.sm },
    futureLabel: { flex: 1 },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    action: { flex: 1 },
  });
}
