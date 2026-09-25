// Kleiner Dialog mit einem Eingabefeld, z. B. für das Monatsbudget.
// Alert.prompt gibt es nur auf iOS – darum ein eigenes Modal für beide Plattformen.
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';
import Button from './Button';
import FieldError from './FieldError';

export default function PromptModal({
  visible,
  title,
  description,
  initialValue = '',
  prefix, // z. B. "CHF"
  keyboardType = 'default',
  validate, // (text) => Fehlertext oder null
  onCancel,
  onSave,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [value, setValue] = useState(initialValue);

  // Beim Öffnen immer mit dem aktuellen Wert starten.
  // React empfiehlt dafür das Anpassen während des Renderns statt eines
  // Effekts (https://react.dev/learn/you-might-not-need-an-effect).
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setValue(initialValue);
    }
  }

  const error = validate ? validate(value) : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}

          <View style={styles.inputRow}>
            {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
            <TextInput
              value={value}
              onChangeText={setValue}
              keyboardType={keyboardType}
              autoFocus
              selectTextOnFocus
              style={styles.input}
              accessibilityLabel={title}
            />
          </View>

          <FieldError message={error} />

          <View style={styles.actions}>
            <Button title="Abbrechen" variant="secondary" size="medium" onPress={onCancel} style={styles.action} />
            <Button
              title="Speichern"
              size="medium"
              onPress={() => onSave(value)}
              disabled={Boolean(error)}
              style={styles.action}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.screen,
    },
    card: {
      width: '100%',
      maxWidth: 380,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    title: {
      ...typography.headlineSm,
      color: colors.text,
    },
    description: {
      ...typography.bodyMd,
      color: colors.textSecondary,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 52,
      paddingHorizontal: spacing.md,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      marginTop: spacing.xs,
    },
    prefix: {
      ...typography.bodyLg,
      color: colors.textSecondary,
    },
    input: {
      flex: 1,
      minHeight: 48,
      ...typography.bodyLg,
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    action: { flex: 1 },
  });
}
