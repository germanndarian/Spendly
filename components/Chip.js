// Auswahl-Chip, z. B. für Kategorien im Formular und die Filter im Verlauf.
// Ausgewählt: grüne Fläche + Häkchen (nicht nur Farbe, damit es auch
// ohne Farbsehen erkennbar ist).
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing, TOUCH_MIN } from '../theme/spacing';
import Icon from './Icon';

// label = Text, dotColor = farbiger Punkt, selected = gewählt, onPress = was beim Tippen passiert
export default function Chip({ label, dotColor, selected = false, onPress }) {
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      // Screenreader sagt «ausgewählt»
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && (selected ? styles.selectedPressed : styles.pressed),
      ]}
    >
      {/* Gewählt: Häkchen. Sonst: der farbige Punkt (falls es einen gibt). */}
      {selected ? (
        <Icon name="check" size={16} color={colors.onAccent} />
      ) : dotColor ? (
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      ) : null}
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    chip: {
      minHeight: TOUCH_MIN,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    pressed: { backgroundColor: colors.pressed },
    selected: {
      backgroundColor: colors.primaryButton,
      borderColor: colors.primaryButton,
    },
    selectedPressed: { backgroundColor: colors.accentPressed },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    label: {
      ...typography.bodyMd,
      fontFamily: typography.labelMd.fontFamily,
      color: colors.text,
    },
    selectedLabel: { color: colors.onAccent },
  });
}
