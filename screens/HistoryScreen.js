// Screen 4 · Verlauf (Tab)
// Alle Ausgaben aus der Datenbank, nach Tag gruppiert, mit Suche und
// Kategorie-Filter. Nach links wischen löscht eine Ausgabe – 5 Sekunden
// lang lässt sich das über die Snackbar rückgängig machen.
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import ExpenseRow from '../components/ExpenseRow';
import Fab from '../components/Fab';
import Icon from '../components/Icon';
import ScreenHeader from '../components/ScreenHeader';
import SwipeableRow from '../components/SwipeableRow';
import { CATEGORIES } from '../utils/categories';
import { filterExpenses, groupByDay } from '../utils/expenseList';
import { formatCHF, formatMonthYear } from '../utils/format';
import { useData } from '../storage/DataContext';

export default function HistoryScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Suchbegriff und Filter werden bewusst nicht gespeichert (kurzlebig)
  const [searchText, setSearchText] = useState('');
  const [categoryId, setCategoryId] = useState(null); // null = "Alle"

  const { expenses, removeExpense, undoRemove, showSnackbar } = useData();
  const filtered = filterExpenses(expenses, searchText, categoryId);
  const sections = groupByDay(filtered);

  // Unterscheidet "noch gar nichts erfasst" von "Filter liefert nichts"
  const hasExpenses = expenses.length > 0;
  const hasFilter = searchText.trim() !== '' || categoryId !== null;

  function resetFilter() {
    setSearchText('');
    setCategoryId(null);
  }

  // Löschen mit Sicherheitsnetz: Die Ausgabe merken und über die
  // Snackbar 5 Sekunden lang zurückholen können.
  async function handleDelete(expense) {
    try {
      await removeExpense(expense.id);
      showSnackbar({
        message: 'Ausgabe gelöscht',
        actionLabel: 'Rückgängig',
        onAction: () => {
          undoRemove(expense).catch((error) => {
            console.warn('Ausgabe konnte nicht wiederhergestellt werden:', error);
            Alert.alert('Nicht wiederhergestellt', 'Die Ausgabe konnte nicht zurückgeholt werden.');
          });
        },
      });
    } catch (error) {
      console.warn('Ausgabe konnte nicht gelöscht werden:', error);
      Alert.alert('Nicht gelöscht', 'Die Ausgabe konnte nicht gelöscht werden.');
    }
  }

  const header = (
    <View>
      <ScreenHeader
        title="Verlauf"
        subtitle={`${formatMonthYear(new Date())} · ${filtered.length} Buchungen`}
      />

      {/* Suchfeld */}
      <View style={styles.search}>
        <Icon name="search" size={20} color={colors.textSecondary} />
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Ausgaben durchsuchen"
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Ausgaben durchsuchen"
        />
        {searchText.length > 0 && (
          <Pressable
            onPress={() => setSearchText('')}
            accessibilityRole="button"
            accessibilityLabel="Suche löschen"
            hitSlop={8}
            style={({ pressed }) => [styles.clearButton, pressed && styles.clearPressed]}
          >
            <Icon name="x" size={18} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Kategorie-Filter (horizontal scrollbar) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroller}
        contentContainerStyle={styles.chips}
      >
        <Chip label="Alle" selected={categoryId === null} onPress={() => setCategoryId(null)} />
        {CATEGORIES.map((category) => (
          <Chip
            key={category.id}
            label={category.label}
            dotColor={category.color}
            selected={categoryId === category.id}
            onPress={() => setCategoryId(category.id)}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        // Überschrift pro Tag mit Tagessumme
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader} accessibilityRole="header">
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionTotal}>{formatCHF(section.totalRappen)}</Text>
          </View>
        )}
        renderItem={({ item, index, section }) => {
          const isFirst = index === 0;
          const isLast = index === section.data.length - 1;
          return (
            <SwipeableRow isFirst={isFirst} isLast={isLast} onDelete={() => handleDelete(item)}>
              <ExpenseRow
                expense={item}
                isFirst={isFirst}
                isLast={isLast}
                onPress={() => navigation.navigate('NewExpense', { expenseId: item.id })}
              />
            </SwipeableRow>
          );
        }}
        ListEmptyComponent={
          hasExpenses ? (
            <EmptyState
              icon="search"
              title="Keine Treffer"
              description="Zu dieser Suche gibt es keine Ausgaben."
              actionLabel={hasFilter ? 'Filter zurücksetzen' : undefined}
              onAction={hasFilter ? resetFilter : undefined}
            />
          ) : (
            <EmptyState
              icon="plus-circle"
              title="Noch keine Ausgaben"
              description="Tippe auf +, um deine erste Ausgabe zu erfassen."
            />
          )
        }
      />

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
      paddingBottom: 96, // Platz für den "+"-Button
    },
    search: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingLeft: spacing.md,
      paddingRight: spacing.sm,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    searchInput: {
      flex: 1,
      minHeight: 48,
      ...typography.bodyLg,
      color: colors.text,
    },
    clearButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.subtle,
    },
    clearPressed: { backgroundColor: colors.pressed },
    // Chips laufen bis an den Bildschirmrand
    chipScroller: {
      marginHorizontal: -spacing.screen,
      marginTop: spacing.md,
    },
    chips: {
      gap: spacing.sm,
      paddingHorizontal: spacing.screen,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingHorizontal: spacing.xs,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      ...typography.labelMd,
      color: colors.textSecondary,
    },
    sectionTotal: {
      ...typography.currencyMd,
      fontSize: 15,
      color: colors.textSecondary,
    },
  });
}
