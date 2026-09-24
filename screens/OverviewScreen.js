// Screen 2 · Übersicht (Tab)
// Beantwortet die wichtigste Frage zuerst: "Wie viel darf ich heute noch ausgeben?"
// Die Zahlen kommen aus der Datenbank: Monatssumme und Tagessummen
// rechnet SQLite aus (siehe storage/expenses.js).
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import ExpenseRow from '../components/ExpenseRow';
import Fab from '../components/Fab';
import Icon from '../components/Icon';
import MonthStrip from '../components/MonthStrip';
import Pill from '../components/Pill';
import ProgressBar from '../components/ProgressBar';
import ScreenHeader from '../components/ScreenHeader';
import { getBudgetStatus } from '../utils/budget';
import { getCategory } from '../utils/categories';
import { sortNewestFirst } from '../utils/expenseList';
import { formatCHF, formatDayLabel, formatMonthName, formatMonthYear } from '../utils/format';
import { useData } from '../storage/DataContext';

export default function OverviewScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { expenses, budgetRappen, spentRappen, dailyTotals } = useData();

  const today = new Date();
  const status = getBudgetStatus(budgetRappen, spentRappen, today);
  // Die Liste kommt schon sortiert aus der Datenbank – wir zeigen die letzten drei
  const recentExpenses = sortNewestFirst(expenses).slice(0, 3);
  const percent = Math.round(status.progress * 100);
  const hasExpenses = expenses.length > 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Übersicht"
          subtitle={formatMonthYear(today)}
          right={<Pill label={`Noch ${status.remainingDays} Tage`} dotColor={colors.accent} />}
        />

        {/* Hauptkarte: Heute noch frei */}
        <Card style={styles.section}>
          <View style={styles.heroHeader}>
            <Text style={styles.overline}>Heute noch frei</Text>
            {status.isOnTrack && <Pill label="Auf Kurs" tone="accent" />}
          </View>

          {status.isOverBudget ? (
            // Budget überschritten: rot, aber immer mit Icon und Text
            <View style={styles.overBudget} accessibilityRole="alert">
              <Icon name="alert-triangle" size={22} color={colors.danger} />
              <Text style={styles.overBudgetText}>
                Budget überschritten um {formatCHF(status.overByRappen)}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.heroAmount} accessibilityLabel={`Heute noch frei: ${formatCHF(status.dailyAllowanceRappen)}`}>
                {formatCHF(status.dailyAllowanceRappen)}
              </Text>
              <Text style={styles.heroCaption}>
                {status.remainingDays === 1
                  ? 'Tagesbudget für heute, den letzten Tag im Monat'
                  : `Tagesbudget für die restlichen ${status.remainingDays} Tage`}
              </Text>
            </>
          )}

          {/* Fortschritt im Monat: Text + Prozent + Balken */}
          <View style={styles.progressBlock}>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressText}>
                {formatCHF(spentRappen)} von {formatCHF(budgetRappen)} ausgegeben
              </Text>
              <Text style={styles.progressPercent}>{percent}%</Text>
            </View>
            <ProgressBar progress={status.progress} />
          </View>
        </Card>

        {/* Monatsstreifen */}
        <View style={styles.section}>
          <MonthStrip
            today={today}
            dailyTotals={dailyTotals}
            dailyBudgetRappen={status.dailyBudgetRappen}
          />
        </View>

        {/* Letzte 3 Ausgaben – oder der Hinweis für den ersten Start */}
        {hasExpenses ? (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle} accessibilityRole="header">
                Letzte Ausgaben
              </Text>
              <Pressable
                onPress={() => navigation.navigate('History')}
                accessibilityRole="button"
                style={({ pressed }) => [styles.linkButton, pressed && styles.linkPressed]}
              >
                <Text style={styles.linkText}>Alle anzeigen</Text>
              </Pressable>
            </View>
            <View>
              {recentExpenses.map((expense, index) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  subtitle={`${getCategory(expense.category).label} · ${formatDayLabel(expense.date, today)}`}
                  isFirst={index === 0}
                  isLast={index === recentExpenses.length - 1}
                  onPress={() => navigation.navigate('NewExpense', { expenseId: expense.id })}
                />
              ))}
            </View>
          </>
        ) : (
          <EmptyState
            icon="plus-circle"
            title={`Noch keine Ausgaben im ${formatMonthName(today)}`}
            description="Tippe auf +, um deine erste Ausgabe zu erfassen."
          />
        )}
      </ScrollView>

      <Fab onPress={() => navigation.navigate('NewExpense')} />
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: spacing.screen,
      paddingBottom: 96, // Platz, damit der "+"-Button nichts verdeckt
    },
    section: {
      marginBottom: spacing.lg,
    },
    heroHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    overline: {
      ...typography.labelSm,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    heroAmount: {
      ...typography.displayHero,
      color: colors.text,
      marginTop: spacing.xs,
    },
    heroCaption: {
      ...typography.bodyMd,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    overBudget: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginVertical: spacing.sm,
    },
    overBudgetText: {
      ...typography.headlineSm,
      color: colors.danger,
      flexShrink: 1,
    },
    progressBlock: {
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
    progressTextRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    progressText: {
      ...typography.labelSm,
      color: colors.text,
      fontVariant: ['tabular-nums'],
      flexShrink: 1,
    },
    progressPercent: {
      ...typography.labelSm,
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    listTitle: {
      ...typography.headlineSm,
      color: colors.text,
    },
    linkButton: {
      minHeight: 48,
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
      marginRight: -spacing.sm, // Text bündig mit dem Rand, Tippfläche trotzdem gross
      borderRadius: 8,
    },
    linkPressed: { backgroundColor: colors.pressed },
    linkText: {
      ...typography.labelMd,
      color: colors.accent,
    },
  });
}
