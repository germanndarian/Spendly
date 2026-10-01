// Kleines Status-Label, z. B. "Noch 8 Tage" oder "Auf Kurs".
// Nicht tippbar – darum darf es kleiner als 48pt sein.
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

// label = Text, dotColor = farbiger Punkt vor dem Text (optional), tone = 'neutral', 'accent' oder 'danger'
export default function Pill({ label, dotColor, tone = 'neutral' }) {
  // Aktuelle Farben holen (hell oder dunkel, je nach Einstellung)
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);

  // tone: 'neutral' (grau), 'accent' (grün), 'danger' (rot)
  const isNeutral = tone === 'neutral';
  // Textfarbe je nach tone
  const textColor = tone === 'accent' ? colors.accent : tone === 'danger' ? colors.danger : colors.textSecondary;
  // Neutral wie in DESIGN.md: Hintergrund wie der Screen plus Haarlinie.
  // Auf dem grauen "subtle" wäre der Kontrast knapp unter 4.5:1.
  const backgroundColor = tone === 'accent' ? colors.accentSoft : tone === 'danger' ? colors.dangerSoft : colors.background;

  return (
    <View style={[styles.pill, { backgroundColor }, isNeutral && styles.outlined]}>
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

// Alle Styles dieser Komponente. Als Funktion, weil sie die aktuellen Farben brauchen.
function createStyles(colors) {
  return StyleSheet.create({
    // Kleine Kapsel: Punkt und Text nebeneinander
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
    },
    // Die neutrale Pill bekommt eine Haarlinie als Rand
    outlined: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    // Farbpunkt vor dem Text
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    // Text der Pill
    label: {
      ...typography.labelSm,
      color: colors.textSecondary,
    },
  });
}
