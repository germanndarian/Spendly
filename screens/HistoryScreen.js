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
import { filterExpenses, getExpenseTime, groupByDay } from '../utils/expenseList';
import { formatCHF } from '../utils/format';
import { useData } from '../storage/DataContext';

// Screen «Verlauf»: alle Ausgaben, nach Tag gruppiert
export default function HistoryScreen({ navigation }) {
  // Farben holen (hell oder dunkel, je nach Einstellung)
  const { colors } = useTheme();
  // Styles mit diesen Farben bauen. useMemo: nur neu, wenn sich die Farben ändern.
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Suchbegriff und Filter werden bewusst nicht gespeichert (kurzlebig)
  const [searchText, setSearchText] = useState('');
  const [categoryId, setCategoryId] = useState(null); // null = "Alle"

  const { expenses, removeExpense } = useData();
  // Bei jeder Eingabe im Suchfeld wird neu gefiltert und gruppiert.
  // Das geht schnell, weil es nur eine Liste im Speicher ist.
  const filtered = filterExpenses(expenses, searchText, categoryId);
  const sections = groupByDay(filtered);

  // Unterscheidet "noch gar nichts erfasst" von "Filter liefert nichts"
  const hasExpenses = expenses.length > 0;
  const trimmedSearch = searchText.trim();
  const hasFilter = trimmedSearch !== '' || categoryId !== null;

  // Wie im Mockup: "32 Buchungen" bzw. mit Suche/Filter "3 Treffer"
  const countLabel = hasFilter
    ? `${filtered.length} Treffer`
    : `${expenses.length} ${expenses.length === 1 ? 'Buchung' : 'Buchungen'}`;

  // «Filter zurücksetzen»: Suche leeren und wieder «Alle» wählen
  function resetFilter() {
    setSearchText('');
    setCategoryId(null);
  }

  // Die Snackbar mit "Rückgängig" zeigt der DataContext an
  async function handleDelete(expense) {
    try {
      await removeExpense(expense);
    } catch (error) {
      console.warn('Ausgabe konnte nicht gelöscht werden:', error);
      Alert.alert('Nicht gelöscht', 'Die Ausgabe konnte nicht gelöscht werden.');
    }
  }

  // Alles über der Liste: Titel, Suchfeld und Filter-Chips.
  // Es wird der SectionList als ListHeaderComponent mitgegeben, damit es mitscrollt.
  const header = (
    <View>
      <ScreenHeader title="Verlauf" subtitle={countLabel} />

      {/* Suchfeld */}
      <View style={styles.search}>
        <Icon name="search" size={20} color={colors.textSecondary} />
        <TextInput
          // Kontrolliertes Eingabefeld: Der Text steht im State, jede Änderung
          // ruft setSearchText auf – und die Liste filtert sofort neu.
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Ausgaben durchsuchen"
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Ausgaben durchsuchen"
        />
        {/* Das «x» zum Leeren erscheint nur, wenn etwas im Suchfeld steht */}
        {searchText.length > 0 && (
          <Pressable
            onPress={() => setSearchText('')}
            accessibilityRole="button"
            accessibilityLabel="Suche löschen"
            // hitSlop vergrössert die Tippfläche um 8 pt in jede Richtung
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
        {/* Ein Chip pro Kategorie. Der gewählte ist grün und hat ein Häkchen. */}
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
      {/* SectionList: eine Liste mit Abschnitten (hier ein Abschnitt pro Tag).
         Sie zeichnet nur die sichtbaren Zeilen – das bleibt auch bei vielen Ausgaben schnell. */}
      <SectionList
        sections={sections}
        // Eindeutiger Schlüssel pro Zeile, damit React sie auseinanderhalten kann
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        // Tages-Überschriften scrollen mit (bleiben nicht oben kleben)
        stickySectionHeadersEnabled={false}
        // Ein Tipp auf die Liste funktioniert auch, wenn die Tastatur offen ist
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        // Überschrift pro Tag mit Tagessumme
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader} accessibilityRole="header">
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionTotal}>{formatCHF(section.totalRappen)}</Text>
          </View>
        )}
        // So wird jede einzelne Ausgabe gezeichnet
        renderItem={({ item, index, section }) => {
          // Die erste und die letzte Zeile eines Tages bekommen runde Ecken
          const isFirst = index === 0;
          const isLast = index === section.data.length - 1;
          // SwipeableRow macht die Zeile wischbar: nach links -> «Löschen»
          return (
            <SwipeableRow isFirst={isFirst} isLast={isLast} onDelete={() => handleDelete(item)}>
              <ExpenseRow
                expense={item}
                // Der Tag steht schon in der Überschrift, darum nur die Uhrzeit
                detail={getExpenseTime(item)}
                isFirst={isFirst}
                isLast={isLast}
                onPress={() => navigation.navigate('NewExpense', { expenseId: item.id })}
                // Wischen geht mit dem Screenreader nicht – darum "Löschen"
                // zusätzlich als Aktion (VoiceOver: nach oben/unten wischen)
                onDelete={() => handleDelete(item)}
              />
            </SwipeableRow>
          );
        }}
        // Wird angezeigt, wenn die Liste leer ist. Zwei Fälle:
        // - es gibt Ausgaben, aber der Filter findet keine -> «Keine Treffer»
        // - es gibt noch gar keine Ausgaben -> Hinweis auf «+»
        ListEmptyComponent={
          hasExpenses ? (
            <EmptyState
              icon="search"
              title={
                trimmedSearch
                  ? `Keine Ausgaben für «${trimmedSearch}» gefunden`
                  : 'Keine Ausgaben in dieser Kategorie'
              }
              description="Überprüfe deine Suchbegriffe oder setze die Filter zurück."
              actionLabel="Filter zurücksetzen"
              onAction={resetFilter}
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

      {/* Runder «+»-Button unten rechts: öffnet das Formular «Neue Ausgabe» */}
      <Fab onPress={() => navigation.navigate('NewExpense')} />
    </SafeAreaView>
  );
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
      paddingBottom: 96, // Platz für den "+"-Button
    },
    // Suchfeld: Lupe, Eingabe und «x» nebeneinander, mindestens 52 pt hoch
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
    // Das Eingabefeld füllt den freien Platz
    searchInput: {
      flex: 1,
      minHeight: 48,
      ...typography.bodyLg,
      color: colors.text,
    },
    // Kleiner runder Knopf zum Leeren der Suche
    clearButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.subtle,
    },
    // Gedrückt: Knopf wird kurz grau
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
    // Tages-Überschrift: Datum links, Tagessumme rechts
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingHorizontal: spacing.xs,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    // Datum des Tages, z. B. «Heute»
    sectionTitle: {
      ...typography.labelMd,
      color: colors.textSecondary,
    },
    // Summe aller Ausgaben dieses Tages
    sectionTotal: {
      ...typography.currencyMd,
      fontSize: 15,
      color: colors.textSecondary,
    },
  });
}
