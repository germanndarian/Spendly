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

// So lange bleibt die Meldung sichtbar (5000 ms = 5 Sekunden)
const DURATION_MS = 5000;

// visible = anzeigen?, message = Text, actionLabel/onAction = Knopf wie «Rückgängig».
// expiresAt hält die ursprüngliche Frist auch nach einem Neustart ein.
export default function Snackbar({ visible, message, icon = 'check-circle', actionLabel, onAction, onHide, expiresAt }) {
  // Aktuelle Farben holen (hell oder dunkel, je nach Einstellung)
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Als State statt als Ref: Der Wert bleibt gleich, darf aber beim
  // Rendern gelesen werden.
  const [slide] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Keine Meldung: nichts zu tun
    if (!visible) return undefined;

    // Von unten einblenden
    slide.setValue(0);
    Animated.timing(slide, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    // Nach 5 Sekunden automatisch schliessen
    const timer = setTimeout(onHide, expiresAt ? Math.max(0, expiresAt - Date.now()) : DURATION_MS);
    return () => clearTimeout(timer);
  }, [visible, message, slide, onHide, expiresAt]);

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
        {/* Symbol links (Standard ist ein Häkchen) */}
        <Icon name={icon} size={20} color={colors.snackbarAction} />
        {/* Meldungstext, höchstens zwei Zeilen */}
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

// Alle Styles dieser Komponente. Als Funktion, weil sie die aktuellen Farben brauchen.
function createStyles(colors) {
  return StyleSheet.create({
    // Schwebt über allen Screens, mit seitlichem Rand
    wrapper: {
      position: 'absolute',
      left: spacing.screen,
      right: spacing.screen,
    },
    // Dunkler Balken mit Symbol, Text und Knopf nebeneinander
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
    // Meldungstext, er nimmt den freien Platz ein
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
    // Gedrückt: Knopf wird blasser
    actionPressed: { opacity: 0.6 },
    // Text des Knopfs (hellgrün, damit er auf dunkel lesbar ist)
    actionText: {
      ...typography.labelMd,
      color: colors.snackbarAction,
    },
  });
}
