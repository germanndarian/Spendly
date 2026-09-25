// Button in vier Varianten:
// - primary:     grüne Fläche, weisser Text (Hauptaktion pro Screen)
// - secondary:   weisse Fläche mit Rahmen
// - destructive: roter Rahmen und roter Text (nur für Löschen)
// - text:        ohne Fläche, z. B. "Code verwenden"
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing, TOUCH_MIN } from '../theme/spacing';
import Icon from './Icon';

// Props sind die Einstellungen, die man von aussen mitgibt, z. B.
// <Button title="Speichern" onPress={handleSave} variant="primary" />
export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'large', // 'large' = 56pt (Hauptbuttons), 'medium' = 48pt
  icon, // Name eines Feather-Icons (optional)
  iconFamily,
  iconPosition = 'left',
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
}) {
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Textfarbe je nach Variante
  let labelColor = colors.text;
  if (variant === 'primary') labelColor = colors.onAccent;
  if (variant === 'destructive') labelColor = colors.danger;
  if (disabled) labelColor = colors.textTertiary;

  // Icon nur bauen, wenn eines angegeben ist
  const iconElement = icon ? <Icon name={icon} family={iconFamily} size={20} color={labelColor} /> : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      // Screenreader sagt «deaktiviert», wenn man nicht tippen kann
      accessibilityState={{ disabled }}
      // Gedrückt-Zustand: Fläche wird dunkler bzw. grau
      style={({ pressed }) => [
        styles.base,
        size === 'large' ? styles.large : styles.medium,
        styles[variant],
        // z. B. styles.primaryPressed – der Name wird aus der Variante zusammengesetzt
        pressed && !disabled && styles[`${variant}Pressed`],
        disabled && variant !== 'text' && styles.disabled,
        style,
      ]}
    >
      {/* Icon links oder rechts vom Text */}
      {iconPosition === 'left' && iconElement}
      <Text style={[styles.label, { color: labelColor }]}>{title}</Text>
      {iconPosition === 'right' && iconElement}
    </Pressable>
  );
}

// Pro Variante gibt es einen normalen und einen gedrückten Stil
function createStyles(colors) {
  return StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: radius.control,
      paddingHorizontal: spacing.md,
    },
    large: { minHeight: 56 },
    medium: { minHeight: TOUCH_MIN },
    label: typography.button,

    primary: { backgroundColor: colors.primaryButton },
    primaryPressed: { backgroundColor: colors.accentPressed },

    secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    secondaryPressed: { backgroundColor: colors.pressed },

    destructive: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.danger },
    destructivePressed: { backgroundColor: colors.dangerSoft },

    text: { backgroundColor: 'transparent' },
    textPressed: { backgroundColor: colors.pressed },

    disabled: { backgroundColor: colors.disabled, borderColor: colors.disabled },
  });
}
