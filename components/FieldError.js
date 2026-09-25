// Fehlermeldung unter einem Eingabefeld.
// Rot allein reicht nicht (z. B. bei Farbenblindheit): darum immer Icon + Text.
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import Icon from './Icon';

export default function FieldError({ message, align = 'left', style }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!message) return null;

  return (
    <View
      style={[styles.row, align === 'center' && styles.center, style]}
      accessibilityRole="alert"
      // Screenreader liest die Meldung vor, sobald sie erscheint
      accessibilityLiveRegion="polite"
    >
      <Icon name="alert-circle" size={16} color={colors.danger} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    center: { justifyContent: 'center' },
    text: {
      ...typography.labelMd,
      color: colors.danger,
      flexShrink: 1,
    },
  });
}
