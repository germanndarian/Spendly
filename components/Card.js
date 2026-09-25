// Weisse Karte mit feinem Rahmen (statt Schatten) und Radius 16.
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius } from '../theme/spacing';

export default function Card({ children, padded = true, style }) {
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Mehrere Styles als Liste: Der spätere gewinnt. So kann «style» von aussen
  // etwas anpassen, z. B. einen Abstand.
  return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
}

function createStyles(colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.card,
      overflow: 'hidden', // Zeilen in der Karte übernehmen die runden Ecken
    },
    padded: {
      padding: 20, // Innenabstand wie der Seitenrand
    },
  });
}
