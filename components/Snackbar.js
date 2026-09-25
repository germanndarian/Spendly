// Kurze Rückmeldung am unteren Rand, z. B. "Ausgabe gelöscht · Rückgängig".
// Sie verschwindet nach 5 Sekunden von selbst – lange genug, um das
// Löschen noch rückgängig zu machen.
import { useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing, TOUCH_MIN } from '../theme/spacing';
import Icon from './Icon';

const DURATION_MS = 5000;

export default function Snackbar({ visible, message, icon = 'check-circle', actionLabel, onAction, onHide }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Als State statt als Ref: Der Wert bleibt gleich, darf aber beim
  // Rendern gelesen werden.
  const [slide] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return undefined;

    // Von unten einblenden
    slide.setValue(0);
    Animated.timing(slide, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    // Nach 5 Sekunden automatisch schliessen
    const timer = setTimeout(onHide, DURATION_MS);
    return () => clearTimeout(timer);
  }, [visible, message, slide, onHide]);

  // Nichts anzeigen, wenn gerade keine Meldung da ist
  if (!visible) return null;

  return (
    <Animated.View
      // Der Rand über der Tab-Leiste, damit nichts verdeckt wird
      style={[
        styles.wrapper,
        { bottom: insets.bottom + 72 },
        {
          opacity: slide,
          // slide läuft von 0 nach 1: Die Snackbar kommt 16 pt von unten
          // und wird dabei sichtbar (opacity)
          transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        },
      ]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.bar}>
        <Icon name={icon} size={20} color={colors.snackbarAction} />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        {actionLabel && onAction ? (
          <Pressable
            onPress={() => {
              // Zuerst die Aktion (z. B. Rückgängig), dann die Snackbar schliessen
              onAction();
              onHide();
            }}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: spacing.screen,
      right: spacing.screen,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 56,
      paddingLeft: spacing.md,
      paddingRight: spacing.sm,
      borderRadius: radius.card,
      backgroundColor: colors.snackbar,
    },
    message: {
      ...typography.bodyMd,
      fontFamily: typography.headlineSm.fontFamily,
      color: colors.onSnackbar,
      flex: 1,
    },
    // "Rückgängig" ist mindestens 48pt hoch
    action: {
      minHeight: TOUCH_MIN,
      justifyContent: 'center',
      paddingHorizontal: 12,
      borderRadius: radius.control,
    },
    actionPressed: { opacity: 0.6 },
    actionText: {
      ...typography.labelMd,
      color: colors.snackbarAction,
    },
  });
}
