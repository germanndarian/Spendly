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
  // Aktuelle Farben holen (hell oder dunkel, je nach Einstellung)
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Hat die Zeile einen Schalter? (false ist auch ein Wert, darum !== undefined)
  const hasSwitch = switchValue !== undefined;
  // Textfarbe: rot bei «destructive», grau wenn deaktiviert, sonst normal
  const labelColor = destructive ? colors.danger : disabled ? colors.textTertiary : colors.text;
  // Iconfarbe: gleiche Regel, normal ist sie grün
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
          // Der Schalterknopf ist in Hell und Dunkel weiss
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

// Alle Styles dieser Komponente. Als Funktion, weil sie die aktuellen Farben brauchen.
function createStyles(colors) {
  return StyleSheet.create({
    // Eine Zeile: mindestens 56 pt hoch, Icon – Text – Wert nebeneinander
    row: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    // Gedrückt: Zeile wird kurz grau
    pressed: { backgroundColor: colors.pressed },
    // Abgerundetes Quadrat hinter dem Icon
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.subtle,
    },
    // Helles Rot hinter dem Icon bei «Alle Daten löschen»
    iconBoxDanger: { backgroundColor: colors.dangerSoft },
    // Label und Hinweis untereinander, sie nehmen den freien Platz ein
    texts: {
      flex: 1,
      gap: 2,
    },
    // Haupttext der Zeile
    label: {
      ...typography.bodyLg,
      color: colors.text,
    },
    // Kleiner Zusatztext unter dem Label
    hint: {
      ...typography.labelSm,
      color: colors.textSecondary,
    },
    // Wert rechts, z. B. «CHF 800.00»
    value: {
      ...typography.bodyMd,
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    // Trennlinie unten (nicht bei der letzten Zeile)
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
