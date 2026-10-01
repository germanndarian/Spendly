// Screen 2 · Übersicht (Tab)
// Beantwortet die wichtigste Frage zuerst: "Wie viel darf ich heute noch ausgeben?"
// Die Zahlen kommen aus der Datenbank: Monatssumme und Tagessummen
// rechnet SQLite aus (siehe storage/expenses.js).
import { useEffect, useMemo, useState } from 'react';
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
import { getExpenseTime, sortNewestFirst } from '../utils/expenseList';
import { formatCHF, formatDayLabel, formatMonthName, formatMonthYear } from '../utils/format';
import { useData } from '../storage/DataContext';

// Screen «Übersicht». navigation erlaubt den Wechsel zu anderen Screens.
export default function OverviewScreen({ navigation }) {
  // Farben holen (hell oder dunkel, je nach Einstellung)
  const { colors } = useTheme();
  // Styles mit diesen Farben bauen. useMemo: nur neu, wenn sich die Farben ändern.
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Daten aus dem DataContext (sie kommen aus der Datenbank)
  const { expenses, settings, budgetRappen, spentRappen, dailyTotals, updateSetting } = useData();

  // Der Tipp "Tippe auf +" erscheint nur beim ersten Mal (Konzept: "Hinweis gesehen").
  // Der Wert wird beim Öffnen einmal festgehalten, damit der Tipp nicht
  // mitten im Anschauen verschwindet.
  const [showHint] = useState(() => !settings.hintSeen);

  // Heutiges Datum (für die restlichen Tage und den Monatsstreifen)
  const today = new Date();
  // Alle Kennzahlen auf einmal: Heute noch frei, überschritten, Fortschritt …
  // (siehe utils/budget.js)
  const status = getBudgetStatus(budgetRappen, spentRappen, today);
  const hasBudget = budgetRappen !== null;
  // Die Liste kommt schon sortiert aus der Datenbank – wir zeigen die letzten drei
  const recentExpenses = sortNewestFirst(expenses).slice(0, 3);
  // 0.755 -> 76 (Prozent für die Anzeige)
  const percent = Math.round(status.progress * 100);
  // Gibt es schon Ausgaben? Wenn nicht, zeigen wir stattdessen den Leerzustand.
  const hasExpenses = expenses.length > 0;

  useEffect(() => {
    // Sobald der Leerzustand mit Tipp gezeigt wurde, merken wir uns das
    if (!hasExpenses && showHint && !settings.hintSeen) {
      updateSetting('hintSeen', true).catch((error) => {
        console.warn('Hinweis konnte nicht gespeichert werden:', error);
      });
    }
  }, [hasExpenses, showHint, settings.hintSeen, updateSetting]);

  // SafeAreaView hält Abstand zu Notch und Bildschirmrand. Unten nicht
  // (edges ohne 'bottom'), weil dort schon die Tab-Leiste ist.
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {/* ScrollView: Der Inhalt lässt sich scrollen, wenn er länger als der Bildschirm ist */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Kopfbereich mit Logo, Titel, Monat und rechts «Noch X Tage» */}
        <ScreenHeader
          title="Übersicht"
          subtitle={formatMonthYear(today)}
          right={<Pill label={`Noch ${status.remainingDays} Tage`} dotColor={colors.accent} />}
        />

        {/* Hauptkarte: Heute noch frei */}
        <Card style={styles.section}>
          {hasBudget ? <>
          <View style={styles.heroHeader}>
            <Text style={styles.overline}>Heute noch frei</Text>
            {/* && heisst: nur anzeigen, wenn die Bedingung stimmt */}
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
              <Text
                style={styles.heroAmount}
                // Grosse Beträge werden kleiner statt abgeschnitten
                numberOfLines={1}
                adjustsFontSizeToFit
                accessibilityLabel={`Heute noch frei: ${formatCHF(status.dailyAllowanceRappen)}`}
              >
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
          </> : <EmptyState
            icon="credit-card"
            title="Budget festlegen"
            description="Lege dein Monatsbudget fest, damit Spendly dein Tagesbudget berechnen kann."
            actionLabel="Zu den Einstellungen"
            onAction={() => navigation.navigate('Settings')}
          />}
        </Card>

        {/* Monatsstreifen */}
        {hasBudget && <View style={styles.section}>
          <MonthStrip
            today={today}
            dailyTotals={dailyTotals}
            dailyBudgetRappen={status.dailyBudgetRappen}
          />
        </View>}

        {/* Letzte 3 Ausgaben – oder der Hinweis für den ersten Start */}
        {hasExpenses ? (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle} accessibilityRole="header">
                Letzte Ausgaben
              </Text>
              <Pressable
                // Wechselt in den Tab «Verlauf»
                onPress={() => navigation.navigate('History')}
                accessibilityRole="button"
                style={({ pressed }) => [styles.linkButton, pressed && styles.linkPressed]}
              >
                <Text style={styles.linkText}>Alle anzeigen</Text>
              </Pressable>
            </View>
            <View>
              {/* map macht aus jeder Ausgabe eine Zeile. key hilft React, die Zeilen
                 auseinanderzuhalten. isFirst/isLast geben der Liste runde Ecken. */}
              {recentExpenses.map((expense, index) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  detail={getRecentDetail(expense, today)}
                  isFirst={index === 0}
                  isLast={index === recentExpenses.length - 1}
                  // Öffnet das Formular zum Bearbeiten. expenseId sagt, welche Ausgabe.
                  onPress={() => navigation.navigate('NewExpense', { expenseId: expense.id })}
                />
              ))}
            </View>

            {/* Reserve im Monat (Mockup "Sparziel") – nur solange das Budget reicht */}
            {hasBudget && !status.isOverBudget && (
              <Card style={[styles.infoCard, styles.savingsCard]}>
                <View style={[styles.infoIcon, styles.savingsIcon]}>
                  <Icon family="mci" name="piggy-bank-outline" size={22} color={colors.accent} />
                </View>
                <View style={styles.infoTexts}>
                  <Text style={styles.infoTitle}>Sparziel {formatMonthName(today)}</Text>
                  <Text style={styles.infoText}>
                    Du hast diesen Monat {formatCHF(status.remainingRappen)} Reserve.
                  </Text>
                </View>
              </Card>
            )}
          </>
        ) : (
          // Leerzustand als kompakte Karte: So bleibt er über dem "+"-Button
          // und wird von ihm nicht verdeckt
          <Card style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Icon name="file-text" size={22} color={colors.textSecondary} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoTitle} accessibilityRole="header">
                Noch keine Ausgaben im {formatMonthName(today)}
              </Text>
              {showHint ? (
                <Text style={styles.infoText}>Tippe auf +, um deine erste Ausgabe zu erfassen.</Text>
              ) : null}
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Runder «+»-Button unten rechts: öffnet das Formular «Neue Ausgabe» */}
      <Fab onPress={() => navigation.navigate('NewExpense')} />
    </SafeAreaView>
  );
}

// Zweite Zeile in "Letzte Ausgaben": "Heute, 12:14" bzw. "Gestern"
// (Uhrzeit nur für heute, wie im Mockup)
function getRecentDetail(expense, today) {
  const day = formatDayLabel(expense.date, today);
  const time = getExpenseTime(expense);
  return day === 'Heute' && time ? `${day}, ${time}` : day;
}

// Alle Styles dieses Screens. Als Funktion, weil sie die aktuellen Farben brauchen.
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
    // Abstand zwischen den Blöcken
    section: {
      marginBottom: spacing.lg,
    },
    // «Heute noch frei» links, «Auf Kurs» rechts
    heroHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    // Kleine Überschrift in Grossbuchstaben
    overline: {
      ...typography.labelSm,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    // Die grösste Zahl der ganzen App
    heroAmount: {
      ...typography.displayHero,
      color: colors.text,
      marginTop: spacing.xs,
    },
    // Erklärung unter der grossen Zahl
    heroCaption: {
      ...typography.bodyMd,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    // Rote Meldung: immer mit Icon und Text, nie nur Farbe
    overBudget: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginVertical: spacing.sm,
    },
    // Text der roten Meldung (bricht bei Platzmangel um)
    overBudgetText: {
      ...typography.headlineSm,
      color: colors.danger,
      flexShrink: 1,
    },
    // Text und Fortschrittsbalken untereinander
    progressBlock: {
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
    // «CHF 604.00 von CHF 800.00» links, Prozent rechts
    progressTextRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    // Text zum Fortschritt, gleich breite Ziffern
    progressText: {
      ...typography.labelSm,
      color: colors.text,
      fontVariant: ['tabular-nums'],
      flexShrink: 1,
    },
    // Prozentzahl rechts
    progressPercent: {
      ...typography.labelSm,
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    // «Letzte Ausgaben» links, «Alle anzeigen» rechts
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    // Überschrift der Liste
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
    // Gedrückt: Link wird kurz grau
    linkPressed: { backgroundColor: colors.pressed },
    // Karte mit Icon links und Text rechts (Leerzustand und Sparziel)
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    // Runder Kreis hinter dem Symbol der Info-Karte
    infoIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.subtle,
    },
    // Titel und Text untereinander, sie nehmen den freien Platz ein
    infoTexts: {
      flex: 1,
      gap: 2,
    },
    // Abstand zwischen Liste und Sparziel
    savingsCard: { marginTop: spacing.lg },
    // Grüner Kreis hinter dem Sparschwein
    savingsIcon: { backgroundColor: colors.accentSoft },
    // Titel der Info-Karte
    infoTitle: {
      ...typography.headlineSm,
      color: colors.text,
    },
    // Erklärung in der Info-Karte
    infoText: {
      ...typography.bodyMd,
      color: colors.textSecondary,
    },
    // Text von «Alle anzeigen» (grün)
    linkText: {
      ...typography.labelMd,
      color: colors.accent,
    },
  });
}
