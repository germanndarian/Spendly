// Screen 3 · Neue Ausgabe (Modal) – wird auch zum Bearbeiten verwendet.
// Phase 1: nur das Layout. Validierung und Speichern folgen in Phase 2.
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';
import Button from '../components/Button';
import Chip from '../components/Chip';
import Icon from '../components/Icon';
import Pill from '../components/Pill';
import { CATEGORIES } from '../utils/categories';
import { formatLongDate, toISODate } from '../utils/format';

export default function NewExpenseScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Mit expenseId wird eine bestehende Ausgabe bearbeitet
  const isEditMode = Boolean(route.params?.expenseId);

  const [amountText, setAmountText] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [description, setDescription] = useState('');
  const [date] = useState(toISODate(new Date())); // Standard: heute

  function close() {
    navigation.goBack();
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
                onChangeText={setAmountText}
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                autoFocus
                style={styles.amountInput}
                accessibilityLabel="Betrag in Franken"
              />
            </View>
            {/* Phase 1: fester Wert, ab Phase 2 aus den echten Daten berechnet */}
            <Pill label="Heute noch frei: CHF 24.50" tone="accent" />
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

          {/* Beschreibung (optional) */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Beschreibung</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="z. B. Migros, Znüni"
              placeholderTextColor={colors.textTertiary}
              style={styles.fieldInput}
              returnKeyType="done"
              accessibilityLabel="Beschreibung, optional"
            />
          </View>

          {/* Datum (Auswahl folgt in Phase 2) */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Datum: ${formatLongDate(date)}`}
            style={({ pressed }) => [styles.field, styles.dateField, pressed && styles.fieldPressed]}
          >
            <View>
              <Text style={styles.fieldLabel}>Datum</Text>
              <Text style={styles.fieldValue}>{formatLongDate(date)}</Text>
            </View>
            <Icon name="calendar" size={20} color={colors.textSecondary} />
          </Pressable>
        </ScrollView>

        {/* Speichern-Button unten in der Daumenzone */}
        <View style={styles.footer}>
          <Button title="Ausgabe speichern" icon="arrow-right" iconPosition="right" onPress={close} />
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
    fieldLabel: {
      ...typography.labelSm,
      color: colors.textSecondary,
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
    footer: {
      paddingHorizontal: spacing.screen,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
  });
}
