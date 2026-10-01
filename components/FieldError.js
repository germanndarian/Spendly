// Fehlermeldung unter einem Eingabefeld.
// Rot allein reicht nicht (z. B. bei Farbenblindheit): darum immer Icon + Text.
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import Icon from './Icon';

// message = Fehlertext (leer = nichts anzeigen), align = links oder mittig, style = zusätzliche Styles
export default function FieldError({ message, align = 'left', style }) {
  // Aktuelle Farben holen (hell oder dunkel, je nach Einstellung)
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Kein Fehler: gar nichts anzeigen (null zeichnet nichts)
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

// Alle Styles dieser Komponente. Als Funktion, weil sie die aktuellen Farben brauchen.
function createStyles(colors) {
  return StyleSheet.create({
    // Icon und Text nebeneinander
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    // Mittig, z. B. unter dem grossen Betragsfeld
    center: { justifyContent: 'center' },
    // Roter Text. flexShrink: Lange Meldungen brechen um, statt abgeschnitten zu werden.
    text: {
      ...typography.labelMd,
      color: colors.danger,
      flexShrink: 1,
    },
  });
}
