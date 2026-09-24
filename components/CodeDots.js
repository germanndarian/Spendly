// Zeigt an, wie viele Ziffern des Codes schon eingegeben sind.
// Bei einem falschen Code werden die Punkte rot.
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';

export default function CodeDots({ length, filled, hasError = false }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={`${filled} von ${length} Ziffern eingegeben`}
    >
      {Array.from({ length }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index < filled && styles.dotFilled,
            hasError && index < filled && styles.dotError,
          ]}
        />
      ))}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.md,
    },
    dot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1.5,
      borderColor: colors.textTertiary,
    },
    dotFilled: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    dotError: {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
    },
  });
}
