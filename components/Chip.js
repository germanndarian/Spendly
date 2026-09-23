// Auswahl-Chip, z. B. für Kategorien im Formular und die Filter im Verlauf.
// Ausgewählt: grüne Fläche + Häkchen (nicht nur Farbe, damit es auch
// ohne Farbsehen erkennbar ist).
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing, TOUCH_MIN } from '../theme/spacing';
import Icon from './Icon';

export default function Chip({ label, dotColor, selected = false, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && (selected ? styles.selectedPressed : styles.pressed),
      ]}
    >
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
