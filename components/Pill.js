// Kleines Status-Label, z. B. "Noch 8 Tage" oder "Auf Kurs".
// Nicht tippbar – darum darf es kleiner als 48pt sein.
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';
import Icon from './Icon';

export default function Pill({ label, dotColor, icon, tone = 'neutral', style }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // tone: 'neutral' (grau), 'accent' (grün), 'danger' (rot)
  const isNeutral = tone === 'neutral';
  const textColor = tone === 'accent' ? colors.accent : tone === 'danger' ? colors.danger : colors.textSecondary;
  // Neutral wie in DESIGN.md: Hintergrund wie der Screen plus Haarlinie.
  // Auf dem grauen "subtle" wäre der Kontrast knapp unter 4.5:1.
  const backgroundColor = tone === 'accent' ? colors.accentSoft : tone === 'danger' ? colors.dangerSoft : colors.background;

  return (
    <View style={[styles.pill, { backgroundColor }, isNeutral && styles.outlined, style]}>
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      {icon ? <Icon name={icon} size={14} color={textColor} /> : null}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
    },
    outlined: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    label: {
      ...typography.labelSm,
      color: colors.textSecondary,
    },
  });
}
