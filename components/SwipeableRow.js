// Zeile, die sich nach links wischen lässt und darunter "Löschen" zeigt.
// Bewusst mit den Bordmitteln von React Native gebaut (Animated + PanResponder),
// damit keine zusätzliche Gesten-Bibliothek nötig ist.
import { useCallback, useMemo, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { radius } from '../theme/spacing';
import Icon from './Icon';

const ACTION_WIDTH = 80; // Breite der Löschfläche (Konzept: 80 pt)

// children = die Zeile, onDelete = «Löschen» wurde getippt, isFirst/isLast = runde Ecken oben bzw. unten
export default function SwipeableRow({ children, onDelete, isFirst = false, isLast = false }) {
  // Aktuelle Farben holen (hell oder dunkel, je nach Einstellung)
  const { colors } = useTheme();
  // Styles mit den aktuellen Farben bauen (neu nur, wenn sich die Farben ändern)
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Als State statt als Ref: Der Wert bleibt über alle Renders gleich,
  // darf aber beim Rendern gelesen werden.
  const [translateX] = useState(() => new Animated.Value(0));
  // Ist die Löschfläche gerade offen? Daraus ergibt sich der Startpunkt der Geste.
  const [isOpen, setIsOpen] = useState(false);

  // Schiebt die Zeile auf (offen) oder zu. Die Feder-Animation macht die Bewegung weich.
  const slideTo = useCallback(
    (open) => {
      setIsOpen(open);
      Animated.spring(translateX, {
        toValue: open ? -ACTION_WIDTH : 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    },
    [translateX]
  );

  // PanResponder wertet die Fingerbewegung aus. gesture.dx = wie weit
  // der Finger waagrecht gewischt hat (negativ = nach links).
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Nur übernehmen, wenn deutlich waagrecht gewischt wird –
        // sonst soll die Liste ganz normal scrollen.
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderMove: (_event, gesture) => {
          const start = isOpen ? -ACTION_WIDTH : 0;
          // Nur nach links, und höchstens bis zur Breite der Löschfläche
          translateX.setValue(Math.min(0, Math.max(-ACTION_WIDTH, start + gesture.dx)));
        },
        onPanResponderRelease: (_event, gesture) => {
          const start = isOpen ? -ACTION_WIDTH : 0;
          // Über die Hälfte gewischt: offen lassen, sonst zurückfedern
          slideTo(start + gesture.dx < -ACTION_WIDTH / 2);
        },
        onPanResponderTerminate: () => slideTo(false),
      }),
    [translateX, slideTo, isOpen]
  );

  function handleDelete() {
    slideTo(false); // Zeile schliessen, danach löschen
    onDelete();
  }

  return (
    <View style={styles.wrapper}>
      {/* Liegt hinter der Zeile und wird beim Wischen sichtbar */}
      <View
        style={[styles.actionLayer, isFirst && styles.actionFirst, isLast && styles.actionLast]}
        // Zugeklappt ist der Knopf unsichtbar – dann auch für den Screenreader
        // (der löscht über die Aktion der Zeile, siehe ExpenseRow)
        accessibilityElementsHidden={!isOpen}
        importantForAccessibility={isOpen ? 'auto' : 'no-hide-descendants'}
      >
        <Pressable
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Ausgabe löschen"
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <Icon name="trash-2" size={20} color={colors.onDanger} />
          <Text style={styles.actionText}>Löschen</Text>
        </Pressable>
      </View>

      {/* Die Zeile selbst: Sie verschiebt sich mit dem Finger nach links */}
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

// Alle Styles dieser Komponente. Als Funktion, weil sie die aktuellen Farben brauchen.
function createStyles(colors) {
  return StyleSheet.create({
    // Rahmen um Zeile und Löschfläche
    wrapper: {
      position: 'relative',
      // Die Zeile verschwindet beim Wischen hinter dem Kartenrand
      overflow: 'hidden',
    },
    // Die rote Löschfläche liegt hinter der Zeile, am rechten Rand
    actionLayer: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: ACTION_WIDTH,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Oberste Zeile: runde Ecke oben rechts
    actionFirst: { borderTopRightRadius: radius.card },
    // Unterste Zeile: runde Ecke unten rechts
    actionLast: { borderBottomRightRadius: radius.card },
    // Der Knopf füllt die ganze rote Fläche
    action: {
      flex: 1,
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    // Gedrückt: Knopf wird etwas blasser
    actionPressed: { opacity: 0.8 },
    // Text «Löschen» unter dem Icon
    actionText: {
      ...typography.labelSm,
      color: colors.onDanger,
    },
  });
}
