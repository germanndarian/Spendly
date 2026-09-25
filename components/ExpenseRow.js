// Eine Zeile in einer Ausgabenliste: Farbpunkt, Beschreibung, Kategorie, Betrag.
// detail: optionaler Zusatz nach der Kategorie, z. B. "Heute" auf der Übersicht.
// isFirst / isLast: Die Zeilen bilden zusammen eine Karte mit runden Ecken
// (wichtig für die SectionList im Verlauf, wo jede Zeile einzeln gerendert wird).
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';
import { getCategory } from '../utils/categories';
import { formatCHF } from '../utils/format';

export default function ExpenseRow({ expense, detail, onPress, onDelete, isFirst = true, isLast = true }) {
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);

  const category = getCategory(expense.category);
  // Ohne Beschreibung zeigen wir den Kategorienamen als Titel –
  // und dann nicht nochmals in der zweiten Zeile
  const title = expense.description || category.label;
  const subtitle =
    [expense.description ? category.label : null, detail].filter(Boolean).join(' · ') ||
    'Ohne Beschreibung';
  const amount = formatCHF(expense.amountRappen);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}, ${amount}`}
      accessibilityHint="Öffnet die Ausgabe zum Bearbeiten"
      // Mit onDelete bietet der Screenreader zusätzlich "Löschen" an
      accessibilityActions={onDelete ? [{ name: 'delete', label: 'Löschen' }] : undefined}
      // Wird aufgerufen, wenn der Screenreader die Aktion «Löschen» auslöst
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'delete') onDelete?.();
      }}
      style={({ pressed }) => [
        styles.row,
        isFirst && styles.first,
        isLast && styles.last,
        pressed && styles.pressed,
      ]}
    >
      {/* Farbpunkt der Kategorie */}
      <View style={[styles.dot, { backgroundColor: category.color }]} />
      <View style={styles.texts}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {/* Betrag rechts, mit gleich breiten Ziffern (tabular-nums) */}
      <Text style={styles.amount}>{amount}</Text>
      {/* Trennlinie, eingerückt bis zur Textspalte – nicht bei der letzten Zeile */}
      {!isLast && <View style={styles.divider} />}
    </Pressable>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    row: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.card,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border,
    },
    first: {
      borderTopWidth: 1,
      borderTopLeftRadius: radius.card,
      borderTopRightRadius: radius.card,
    },
    last: {
      borderBottomWidth: 1,
      borderBottomLeftRadius: radius.card,
      borderBottomRightRadius: radius.card,
    },
    pressed: { backgroundColor: colors.pressed },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    texts: {
      flex: 1,
      gap: 2,
    },
    title: {
      ...typography.bodyMd,
      fontFamily: typography.headlineSm.fontFamily,
      color: colors.text,
    },
    subtitle: {
      ...typography.labelSm,
      color: colors.textSecondary,
    },
    amount: {
      ...typography.currencyMd,
      color: colors.text,
    },
    divider: {
      position: 'absolute',
      left: 40,
      right: spacing.md,
      bottom: 0,
      height: 1,
      backgroundColor: colors.border,
    },
  });
}
