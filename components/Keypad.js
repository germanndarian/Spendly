// Zahlenblock für die Code-Eingabe.
// Die Tasten sind 72 x 72 pt gross, damit man den Code auch einhändig
// und unterwegs sicher tippt.
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import Icon from './Icon';

// null = leeres Feld unten links, damit die 0 in der Mitte steht
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0', 'delete'];

export default function Keypad({ onDigit, onDelete, disabled = false }) {
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.grid}>
      {/* Eine Taste pro Eintrag in KEYS. Die Breite von 248 pt lässt genau drei
         Tasten nebeneinander – flexWrap bricht danach in die nächste Zeile um. */}
      {KEYS.map((key, index) => {
        // Leeres Feld unten links: nur Platzhalter, nicht tippbar
        if (key === null) {
          return <View key={`empty-${index}`} style={styles.key} />;
        }

        const isDelete = key === 'delete';
        return (
          <Pressable
            key={key}
            // Löschtaste oder Ziffer – was damit passiert, entscheidet der Screen
            onPress={() => (isDelete ? onDelete() : onDigit(key))}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={isDelete ? 'Letzte Ziffer löschen' : `Ziffer ${key}`}
            style={({ pressed }) => [
              styles.key,
              !isDelete && styles.keyFilled,
              pressed && !disabled && styles.keyPressed,
            ]}
          >
            {isDelete ? (
              <Icon name="delete" size={24} color={colors.textSecondary} />
            ) : (
              <Text style={styles.keyLabel}>{key}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    grid: {
      width: 248, // 3 x 72 pt + 2 x 16 pt Abstand
      alignSelf: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    key: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Gefüllte graue Kreise wie im Mockup (die Löschtaste bleibt ohne Fläche)
    keyFilled: {
      backgroundColor: colors.subtle,
    },
    keyPressed: { backgroundColor: colors.pressed },
    keyLabel: {
      ...typography.headlineMd,
      fontSize: 24,
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
  });
}
