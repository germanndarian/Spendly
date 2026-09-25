// Farbpalette von Spendly (Quelle: DESIGN.md)
// Screens verwenden diese Farben nie direkt, sondern immer über useTheme(),
// damit der Dark Mode automatisch funktioniert.

// Farben für das helle Design
export const lightColors = {
  background: '#F6F5F1', // warmes Off-White (App-Hintergrund)
  card: '#FFFFFF', // Karten und Eingabefelder
  border: '#E7E5DF', // Haarlinien statt Schatten
  text: '#15171A', // Haupttext ("Tinte")
  textSecondary: '#6E6D68', // Labels, Metadaten
  textTertiary: '#9D9C96', // Placeholder, deaktiviert
  accent: '#1F5A45', // einzige Akzentfarbe (Waldgrün)
  primaryButton: '#1F5A45', // Fläche von grünen Buttons
  accentPressed: '#174434', // gedrückter Zustand von grünen Buttons
  accentSoft: '#E3EEE8', // heller Grünton für Badges und gewählte Chips
  onAccent: '#FFFFFF', // Text auf grünem Hintergrund
  danger: '#B4432D', // nur für Budget überschritten, Fehler, Löschen
  onDanger: '#FFFFFF', // Text auf roter Fläche (z. B. "Löschen" beim Wischen)
  dangerSoft: '#F7E6E1', // heller Hintergrund hinter Fehler-Icons
  pressed: '#EFEDE7', // gedrückter Zustand von hellen Flächen
  subtle: '#EFEEE9', // Pills, Icon-Kreise, Fortschritts-Hintergrund
  chartBar: '#5F5E5A', // vergangene Tage im Monatsstreifen
  disabled: '#E4E2DC', // Hintergrund von deaktivierten Buttons
  overlay: 'rgba(21, 23, 26, 0.4)', // abgedunkelter Hintergrund hinter Dialogen
  snackbar: '#15171A', // dunkle Snackbar
  onSnackbar: '#FFFFFF',
  // Helles Grün, damit "Rückgängig" auf der dunklen Snackbar lesbar bleibt
  snackbarAction: '#7CC4A4',
};

// Farben für das dunkle Design. Gleiche Namen wie oben, nur andere Werte.
// So schreibt jeder Screen einfach colors.text – egal ob hell oder dunkel.
export const darkColors = {
  background: '#121413',
  card: '#1B1E1C',
  border: '#2C302D',
  text: '#EDECE7',
  textSecondary: '#A6A59F',
  textTertiary: '#75746F',
  accent: '#7CC4A4', // helleres Grün, damit es auf Dunkel lesbar bleibt
  // Button-Fläche dunkler als der Text-Akzent, damit weisser Text lesbar bleibt
  primaryButton: '#2E7358',
  accentPressed: '#255E49',
  accentSoft: '#1E3A2F',
  onAccent: '#FFFFFF',
  danger: '#E0775F',
  // Auf dem hellen Rot wäre Weiss zu schwach (3:1) – darum dunkle Schrift
  onDanger: '#15171A',
  dangerSoft: '#3A221C',
  pressed: '#242825',
  subtle: '#262A27',
  chartBar: '#8C8B85',
  disabled: '#2A2D2B',
  overlay: 'rgba(0, 0, 0, 0.6)',
  snackbar: '#EDECE7',
  onSnackbar: '#15171A',
  // Im Dark Mode ist die Snackbar hell – darum das dunkle Grün
  snackbarAction: '#1F5A45',
};

// Kategoriefarben (gleich in Hell und Dunkel)
export const categoryColors = {
  food: '#8FA68E', // Essen & Trinken (Salbei)
  transport: '#7C8B9C', // Mobilität (Schieferblau)
  leisure: '#B98468', // Freizeit (Terrakotta)
  shopping: '#C8B38A', // Shopping (Ocker)
  subscriptions: '#8E8299', // Abos (Heide)
  other: '#A5A29A', // Sonstiges (Stein)
};
