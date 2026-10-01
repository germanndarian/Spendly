// Schriftzug "spendly" mit grünem Punkt (Logo aus dem Mockup).
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/typography';

// Das Logo: Schrift «spendly» mit grünem Punkt. Braucht keine Props.
export default function Wordmark() {
  // Aktuelle Farben holen (hell oder dunkel, je nach Einstellung)
  const { colors } = useTheme();

  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="Spendly">
      <Text style={[styles.text, { color: colors.text }]}>spendly</Text>
      <View style={[styles.dot, { backgroundColor: colors.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Schrift und Punkt nebeneinander, unten bündig
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  // Serifenschrift wie im Logo
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
