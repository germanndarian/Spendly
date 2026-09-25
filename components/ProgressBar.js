// Budget-Fortschrittsbalken (6pt hoch).
// Grün solange das Budget reicht, rot sobald es überschritten ist.
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius } from '../theme/spacing';

export default function ProgressBar({ progress }) {
  const { colors } = useTheme();

  const isOver = progress > 1;
  // Balken nie breiter als 100 %
  const widthPercent = Math.min(Math.max(progress, 0), 1) * 100;

  return (
    <View
      style={[styles.track, { backgroundColor: colors.subtle }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      <View
        style={[
          styles.fill,
          // Breite in Prozent; grün im Budget, rot darüber
          { width: `${widthPercent}%`, backgroundColor: isOver ? colors.danger : colors.accent },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
