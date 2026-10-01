// Kleiner Dialog mit einem Eingabefeld, z. B. für das Monatsbudget.
// Alert.prompt gibt es nur auf iOS – darum ein eigenes Modal für beide Plattformen.
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';
import Button from './Button';
import FieldError from './FieldError';

// Props: visible = sichtbar?, title/description = Texte, initialValue = Startwert, prefix = Text vor dem Feld,
// keyboardType = Tastatur, validate = Prüffunktion, onCancel/onSave = was bei den Buttons passiert
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
  // Aktuelle Farben holen (hell oder dunkel, je nach Einstellung)
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Der Text, der gerade im Eingabefeld steht
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

  // Bei jeder Eingabe prüfen. Mit Fehler bleibt «Speichern» gesperrt.
  const error = validate ? validate(value) : null;

  // Modal legt sich über den ganzen Screen. transparent + overlay-Farbe =
  // abgedunkelter Hintergrund. onRequestClose: Zurück-Taste auf Android schliesst.
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
              // Die Tastatur öffnet sich sofort
              autoFocus
              // Der bestehende Wert ist markiert und lässt sich direkt überschreiben
              selectTextOnFocus
              style={styles.input}
              accessibilityLabel={title}
            />
          </View>

          {/* Fehlermeldung, falls der Text ungültig ist */}
          <FieldError message={error} />

          <View style={styles.actions}>
            <Button title="Abbrechen" variant="secondary" size="medium" onPress={onCancel} style={styles.action} />
            <Button
              title="Speichern"
              size="medium"
              // Den eingegebenen Text an den Screen zurückgeben
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

// Alle Styles dieser Komponente. Als Funktion, weil sie die aktuellen Farben brauchen.
function createStyles(colors) {
  return StyleSheet.create({
    // Abgedunkelter Hintergrund über dem ganzen Screen, der Dialog steht in der Mitte
    overlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.screen,
    },
    // Weisse Dialog-Karte, höchstens 380 pt breit
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
    // Titel des Dialogs
    title: {
      ...typography.headlineSm,
      color: colors.text,
    },
    // Erklärung unter dem Titel
    description: {
      ...typography.bodyMd,
      color: colors.textSecondary,
    },
    // Eingabefeld mit Rahmen (davor z. B. «CHF»)
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
    // Text vor dem Eingabefeld
    prefix: {
      ...typography.bodyLg,
      color: colors.textSecondary,
    },
    // Das Eingabefeld selbst, mit gleich breiten Ziffern
    input: {
      flex: 1,
      minHeight: 48,
      ...typography.bodyLg,
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    // Die beiden Buttons nebeneinander
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    // Beide Buttons sind gleich breit
    action: { flex: 1 },
  });
}
