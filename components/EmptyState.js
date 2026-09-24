// Leerzustand oder Fehlermeldung mitten im Screen.
// Sagt immer, was los ist UND was man als Nächstes tun kann.
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import Button from './Button';
import Icon from './Icon';

export default function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  tone = 'neutral', // 'neutral' oder 'danger' (Fehler)
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDanger = tone === 'danger';

  return (
    <View style={styles.wrapper} accessibilityRole={isDanger ? 'alert' : undefined}>
      <View style={[styles.iconCircle, isDanger && styles.iconCircleDanger]}>
        <Icon name={icon} size={26} color={isDanger ? colors.danger : colors.textSecondary} />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
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

function createStyles(colors) {
  return StyleSheet.create({
    wrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.subtle,
      marginBottom: spacing.sm,
    },
    iconCircleDanger: { backgroundColor: colors.dangerSoft },
    title: {
      ...typography.headlineSm,
      color: colors.text,
      textAlign: 'center',
    },
    description: {
      ...typography.bodyMd,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 300,
    },
    action: { marginTop: spacing.sm },
  });
}
