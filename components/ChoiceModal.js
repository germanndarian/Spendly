// Dialog mit einer Liste von Auswahlmöglichkeiten, z. B. für die Sperrzeit.
// Alert.alert erlaubt auf Android höchstens 3 Buttons – darum ein eigenes Modal.
import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';
import Button from './Button';
import Icon from './Icon';

export default function ChoiceModal({
  visible,
  title,
  description,
  options, // [{ key, label }]
  selectedKey,
  onSelect,
  onCancel,
}) {
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}

          <View style={styles.list} accessibilityRole="radiogroup">
            {/* Eine Zeile pro Auswahl. Die gewählte bekommt ein Häkchen. */}
            {options.map((option, index) => {
              const selected = option.key === selectedKey;
              return (
                <Pressable
                  key={option.label}
                  // Auswahl an den Screen zurückgeben
                  onPress={() => onSelect(option.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  style={({ pressed }) => [
                    styles.row,
                    index > 0 && styles.rowDivider,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
                  {/* Häkchen statt nur Farbe, damit die Auswahl immer erkennbar ist */}
                  {selected ? <Icon name="check" size={20} color={colors.accent} /> : null}
                </Pressable>
              );
            })}
          </View>

          <Button title="Abbrechen" variant="secondary" size="medium" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.screen,
    },
    card: {
      width: '100%',
      maxWidth: 380,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    title: {
      ...typography.headlineSm,
      color: colors.text,
    },
    description: {
      ...typography.bodyMd,
      color: colors.textSecondary,
    },
    list: {
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginVertical: spacing.sm,
    },
    row: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
    },
    rowDivider: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowPressed: { backgroundColor: colors.pressed },
    label: {
      ...typography.bodyLg,
      color: colors.text,
    },
    labelSelected: {
      fontFamily: typography.headlineSm.fontFamily,
    },
  });
}
