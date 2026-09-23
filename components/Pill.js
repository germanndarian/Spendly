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
  const textColor = tone === 'accent' ? colors.accent : tone === 'danger' ? colors.danger : colors.textSecondary;
  const backgroundColor = tone === 'accent' ? colors.accentSoft : tone === 'danger' ? colors.dangerSoft : colors.subtle;

  return (
    <View style={[styles.pill, { backgroundColor }, style]}>
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
