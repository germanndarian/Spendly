// Runder "+"-Button unten rechts (Floating Action Button), 56 × 56pt.
// Liegt in der Daumenzone und öffnet das Formular "Neue Ausgabe".
import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import Icon from './Icon';

// onPress = was beim Tippen passiert (öffnet «Neue Ausgabe»)
export default function Fab({ onPress }) {
  // Aktuelle Farben holen (hell oder dunkel, je nach Einstellung)
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      // Icon-Button ohne Text: Screenreader braucht eine Beschriftung
      accessibilityRole="button"
      accessibilityLabel="Neue Ausgabe erfassen"
      // Pressable gibt «pressed» mit: Beim Drücken wird der Button dunkler
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
    >
      <Icon name="plus" size={28} color={colors.onAccent} />
    </Pressable>
  );
}

// Alle Styles dieser Komponente. Als Funktion, weil sie die aktuellen Farben brauchen.
function createStyles(colors) {
  return StyleSheet.create({
    // Runder Button, 56 × 56 pt, schwebt unten rechts über dem Inhalt
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
    // Gedrückt: dunkleres Grün
    pressed: {
      backgroundColor: colors.accentPressed,
    },
  });
}
