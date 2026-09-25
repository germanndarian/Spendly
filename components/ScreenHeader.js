// Kopfbereich der Tab-Screens: Logo, Titel, Untertitel und optional ein
// Element rechts (z. B. die Pill "Noch 8 Tage").
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import Wordmark from './Wordmark';

export default function ScreenHeader({ title, subtitle, right }) {
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

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    logoRow: {
      minHeight: 48,
      justifyContent: 'center',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    titleBlock: {
      flexShrink: 1,
      gap: 2,
    },
    title: {
      ...typography.headlineMd,
      fontSize: 28,
      lineHeight: 34,
      color: colors.text,
    },
    subtitle: {
      ...typography.labelMd,
      color: colors.textSecondary,
    },
  });
}
