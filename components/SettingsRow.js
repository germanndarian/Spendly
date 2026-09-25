// Eine Zeile in den Einstellungen. Die ganze Zeile ist tippbar, nicht nur der Pfeil.
// Varianten:
// - mit onPress:          Wert + Pfeil rechts ("CHF 800.00 >")
// - mit switchValue:      Schalter rechts, Tippen auf die Zeile schaltet um
// - ohne beides:          reine Anzeige
import { useMemo } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import Icon from './Icon';

export default function SettingsRow({
  icon,
  label,
  value,
  hint, // kleiner Zusatztext unter dem Label
  onPress,
  switchValue, // true/false → Zeile zeigt einen Schalter
  onSwitchChange,
  destructive = false,
  disabled = false,
  isLast = false,
  accessibilityHint,
}) {
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Hat die Zeile einen Schalter? (false ist auch ein Wert, darum !== undefined)
  const hasSwitch = switchValue !== undefined;
  const labelColor = destructive ? colors.danger : disabled ? colors.textTertiary : colors.text;
  const iconColor = destructive ? colors.danger : disabled ? colors.textTertiary : colors.accent;

  // Bei einer Schalter-Zeile schaltet ein Tipp auf die Zeile den Schalter um
  const handlePress = hasSwitch ? () => onSwitchChange?.(!switchValue) : onPress;

  // Der Inhalt ist immer gleich – nur die Hülle unterscheidet sich:
  // View (nur Anzeige) oder Pressable (tippbar)
  const content = (
    <>
      <View style={[styles.iconBox, destructive && styles.iconBoxDanger]}>
        <Icon name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.texts}>
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {hasSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          disabled={disabled}
          trackColor={{ false: colors.border, true: colors.primaryButton }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={colors.border}
          // Der Screenreader liest die ganze Zeile vor, nicht den Schalter einzeln
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        />
      )}
      {!hasSwitch && onPress && <Icon name="chevron-right" size={18} color={colors.textTertiary} />}
      {!isLast && <View style={styles.divider} />}
    </>
  );

  // Reine Anzeige: kein Pressable, kein Gedrückt-Zustand
  if (!handlePress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole={hasSwitch ? 'switch' : 'button'}
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityHint={accessibilityHint ?? hint}
      accessibilityState={hasSwitch ? { checked: switchValue, disabled } : { disabled }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    row: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    pressed: { backgroundColor: colors.pressed },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.subtle,
    },
    iconBoxDanger: { backgroundColor: colors.dangerSoft },
    texts: {
      flex: 1,
      gap: 2,
    },
    label: {
      ...typography.bodyLg,
      color: colors.text,
    },
    hint: {
      ...typography.labelSm,
      color: colors.textSecondary,
    },
    value: {
      ...typography.bodyMd,
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    divider: {
      position: 'absolute',
      left: 64, // bündig mit der Textspalte (16 + 36 + 12)
      right: 0,
      bottom: 0,
      height: 1,
      backgroundColor: colors.border,
    },
  });
}
