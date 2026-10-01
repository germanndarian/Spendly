// Kopfbereich der Tab-Screens: Logo, Titel, Untertitel und optional ein
// Element rechts (z. B. die Pill "Noch 8 Tage").
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import Wordmark from './Wordmark';

// title = Titel, subtitle = kleine Zeile darunter (optional), right = Element rechts (optional)
export default function ScreenHeader({ title, subtitle, right }) {
  // Aktuelle Farben holen (hell oder dunkel, je nach Einstellung)
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Wordmark />
      </View>
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {/* Untertitel nur, wenn einer übergeben wurde */}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {/* Optionales Element rechts, z. B. die Pill «Noch 8 Tage» */}
        {right}
      </View>
    </View>
  );
}

// Alle Styles dieser Komponente. Als Funktion, weil sie die aktuellen Farben brauchen.
function createStyles(colors) {
  return StyleSheet.create({
    // Abstand oben und unten
    container: {
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    // Zeile mit dem Logo, mindestens 48 pt hoch
    logoRow: {
      minHeight: 48,
      justifyContent: 'center',
    },
    // Titel links, optionales Element rechts
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    // Titel und Untertitel untereinander
    titleBlock: {
      flexShrink: 1,
      gap: 2,
    },
    // Grosser Titel des Screens
    title: {
      ...typography.headlineMd,
      fontSize: 28,
      lineHeight: 34,
      color: colors.text,
    },
    // Kleine graue Zeile unter dem Titel
    subtitle: {
      ...typography.labelMd,
      color: colors.textSecondary,
    },
  });
}
