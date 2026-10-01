// Leerzustand oder Fehlermeldung mitten im Screen.
// Sagt immer, was los ist UND was man als Nächstes tun kann.
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import Button from './Button';
import Icon from './Icon';

// Props: icon = Symbol, title/description = Texte, actionLabel/onAction = Button (optional), tone = 'neutral' oder 'danger'
export default function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  tone = 'neutral', // 'neutral' oder 'danger' (Fehler)
}) {
  // Aktuelle Farben holen (hell oder dunkel, je nach Einstellung)
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Fehlerzustand? Dann wird das Symbol rot (immer zusammen mit Text)
  const isDanger = tone === 'danger';

  return (
    <View style={styles.wrapper} accessibilityRole={isDanger ? 'alert' : undefined}>
      <View style={[styles.iconCircle, isDanger && styles.iconCircleDanger]}>
        <Icon name={icon} size={26} color={isDanger ? colors.danger : colors.textSecondary} />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {/* Beschreibung nur, wenn eine übergeben wurde */}
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {/* Button nur, wenn Text und Aktion angegeben sind */}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          variant="secondary"
          size="medium"
          onPress={onAction}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

// Alle Styles dieser Komponente. Als Funktion, weil sie die aktuellen Farben brauchen.
function createStyles(colors) {
  return StyleSheet.create({
    // Alles untereinander und mittig
    wrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    // Grauer Kreis hinter dem Symbol
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.subtle,
      marginBottom: spacing.sm,
    },
    // Heller roter Kreis bei einem Fehler
    iconCircleDanger: { backgroundColor: colors.dangerSoft },
    // Titel, fett und mittig
    title: {
      ...typography.headlineSm,
      color: colors.text,
      textAlign: 'center',
    },
    // Erklärung, höchstens 300 pt breit, damit der Text nicht zu lang wird
    description: {
      ...typography.bodyMd,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 300,
    },
    // Abstand zwischen Text und Button
    action: { marginTop: spacing.sm },
  });
}
