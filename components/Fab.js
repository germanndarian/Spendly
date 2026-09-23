// Runder "+"-Button unten rechts (Floating Action Button), 56 × 56pt.
// Liegt in der Daumenzone und öffnet das Formular "Neue Ausgabe".
import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import Icon from './Icon';

export default function Fab({ onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      // Icon-Button ohne Text: Screenreader braucht eine Beschriftung
      accessibilityRole="button"
      accessibilityLabel="Neue Ausgabe erfassen"
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
    >
      <Icon name="plus" size={28} color={colors.onAccent} />
    </Pressable>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    fab: {
      position: 'absolute',
      right: spacing.md,
      bottom: spacing.md,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryButton,
    },
    pressed: {
      backgroundColor: colors.accentPressed,
    },
  });
}
