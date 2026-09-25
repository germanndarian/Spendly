// Monatsstreifen: ein dünner Balken pro Tag.
// - vergangene Tage: grau, Höhe = Ausgaben des Tages
// - heute: grün mit Punkt
// - Tage über dem Tagesbudget: kleiner roter Punkt (mit Legende "Über Budget")
// - zukünftige Tage: kurze, blasse Platzhalter
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import Card from './Card';
import { formatMonthName, formatShortDate } from '../utils/format';

const BAR_AREA_HEIGHT = 56; // Höhe des Bereichs für die Balken
const MIN_BAR_HEIGHT = 4; // auch Tage ohne Ausgaben sind sichtbar

export default function MonthStrip({ today, dailyTotals, dailyBudgetRappen }) {
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);

  const year = today.getFullYear();
  const month = today.getMonth();
  const todayDay = today.getDate();
  // Tag 0 des nächsten Monats = letzter Tag dieses Monats
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Der höchste Balken füllt die ganze Höhe
  // ...dailyTotals verteilt die Liste in einzelne Werte.
  // Die 1 verhindert eine Division durch 0, wenn noch nichts ausgegeben wurde.
  const maxValue = Math.max(dailyBudgetRappen, ...dailyTotals, 1);

  // Für jeden Tag des Monats einen Eintrag vorbereiten
  const days = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const total = dailyTotals[day - 1] ?? 0;
    const isFuture = day > todayDay;
    days.push({
      day,
      isToday: day === todayDay,
      isFuture,
      isOver: !isFuture && total > dailyBudgetRappen,
      // Höhe im Verhältnis zum höchsten Wert. -12 lässt oben Platz für die Punkte.
      height: isFuture ? 6 : Math.max(MIN_BAR_HEIGHT, (total / maxValue) * (BAR_AREA_HEIGHT - 12)),
    });
  }
  // Wie viele Tage lagen über dem Tagesbudget? (für Legende und Screenreader)
  const overCount = days.filter((d) => d.isOver).length;

  const monthName = formatMonthName(today);
  const firstLabel = formatShortDate(new Date(year, month, 1));
  const lastLabel = formatShortDate(new Date(year, month, daysInMonth));

  return (
    <Card padded={false} style={styles.card}>
      <View
        accessible
        accessibilityLabel={`Monatsverlauf ${monthName}: heute ist Tag ${todayDay} von ${daysInMonth}. ${overCount} Tage über dem Tagesbudget.`}
      >
        {/* Titel und Legende */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>
            {monthName} ({daysInMonth} Tage)
          </Text>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
              <Text style={styles.legendText}>Heute ({todayDay}.)</Text>
            </View>
            {overCount > 0 && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                <Text style={styles.legendText}>Über Budget</Text>
              </View>
            )}
          </View>
        </View>

        {/* Ein Balken pro Tag */}
        <View style={styles.bars}>
          {/* Ein Balken pro Tag. Darüber: roter Punkt (über Budget) bzw. grüner Punkt (heute). */}
          {days.map((d) => (
            <View key={d.day} style={styles.dayColumn}>
              {d.isOver && <View style={styles.overDot} />}
              {d.isToday && <View style={styles.todayDot} />}
              <View
                style={[
                  styles.bar,
                  { height: d.height },
                  d.isToday && styles.barToday,
                  d.isFuture && styles.barFuture,
                ]}
              />
            </View>
          ))}
        </View>

        {/* Beschriftung unter den Balken */}
        <View style={styles.labels}>
          <Text style={[styles.axisLabel, todayDay === 1 && styles.axisToday]}>
            {todayDay === 1 ? `Heute (${firstLabel})` : firstLabel}
          </Text>
          {todayDay !== 1 && todayDay !== daysInMonth && <Text style={[styles.axisLabel, styles.axisToday]}>Heute</Text>}
          <Text style={[styles.axisLabel, todayDay === daysInMonth && styles.axisToday]}>
            {todayDay === daysInMonth ? `Heute (${lastLabel})` : lastLabel}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    card: {
      padding: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    title: {
      ...typography.labelMd,
      fontFamily: typography.headlineSm.fontFamily,
      color: colors.text,
    },
    legend: {
      flexDirection: 'row',
      gap: 12,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    legendDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    legendText: {
      ...typography.labelSm,
      color: colors.textSecondary,
    },
    bars: {
      height: BAR_AREA_HEIGHT,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 3,
    },
    dayColumn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    bar: {
      width: '100%',
      borderRadius: 2,
      backgroundColor: colors.chartBar,
    },
    barToday: { backgroundColor: colors.accent },
    barFuture: { backgroundColor: colors.border },
    overDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      marginBottom: 3,
      backgroundColor: colors.danger,
    },
    todayDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginBottom: 3,
      backgroundColor: colors.accent,
    },
    labels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    axisLabel: {
      ...typography.labelSm,
      color: colors.textSecondary,
    },
    axisToday: {
      fontFamily: typography.headlineSm.fontFamily,
      color: colors.accent,
    },
  });
}
