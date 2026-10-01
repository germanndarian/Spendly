// Zeigt an, wie viele Ziffern des Codes schon eingegeben sind.
// Bei einem falschen Code werden die Punkte rot.
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';

// length = Anzahl Stellen des Codes, filled = wie viele schon getippt sind, hasError = rot anzeigen
export default function CodeDots({ length, filled, hasError = false }) {
  // Aktuelle Farben holen (hell oder dunkel, je nach Einstellung)
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={`${filled} von ${length} Ziffern eingegeben`}
    >
      {/* Array.from erzeugt 6 Einträge -> 6 Punkte. Die ersten «filled» sind ausgefüllt. */}
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

// Alle Styles dieser Komponente. Als Funktion, weil sie die aktuellen Farben brauchen.
function createStyles(colors) {
  return StyleSheet.create({
    // Alle Punkte nebeneinander, mittig
    row: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.md,
    },
    // Leerer Punkt: nur ein Rand
    dot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1.5,
      borderColor: colors.textTertiary,
    },
    // Eingegebene Ziffer: grün gefüllt
    dotFilled: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    // Falscher Code: rot gefüllt
    dotError: {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
    },
  });
}
