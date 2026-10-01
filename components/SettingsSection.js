// Gruppe in den Einstellungen: Überschrift ("SICHERHEIT") + Karte mit Zeilen.
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import Card from './Card';

// title = Überschrift, footer = Hinweis unter der Karte, children = die Zeilen
export default function SettingsSection({ title, footer, children }) {
  // Aktuelle Farben holen (hell oder dunkel, je nach Einstellung)
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      {title ? (
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      {/* Die Zeilen (children) liegen zusammen in einer weissen Karte */}
      <Card padded={false}>{children}</Card>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

// Alle Styles dieser Komponente. Als Funktion, weil sie die aktuellen Farben brauchen.
function createStyles(colors) {
  return StyleSheet.create({
    // Abstand zur nächsten Gruppe
    section: {
      marginBottom: spacing.lg,
    },
    // Kleine Überschrift in Grossbuchstaben
    title: {
      ...typography.labelSm,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginLeft: spacing.xs,
      marginBottom: spacing.sm,
    },
    // Hinweistext unter der Karte
    footer: {
      ...typography.labelSm,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      marginHorizontal: spacing.xs,
    },
  });
}
