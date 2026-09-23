// Schriftzug "spendly" mit grünem Punkt (Logo aus dem Mockup).
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/typography';

export default function Wordmark() {
  const { colors } = useTheme();

  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="Spendly">
      <Text style={[styles.text, { color: colors.text }]}>spendly</Text>
      <View style={[styles.dot, { backgroundColor: colors.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  text: {
    fontFamily: fonts.serifBold,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 7, // sitzt auf der Grundlinie der Schrift
  },
});
