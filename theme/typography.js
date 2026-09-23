// Schriften und Textstile (Quelle: DESIGN.md)
// Wichtig: Bei eigenen Schriften setzen wir KEIN fontWeight, sondern wählen
// die passende Schriftdatei (z. B. Inter_600SemiBold). Sonst sieht es auf
// Android falsch aus.

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  serif: 'Newsreader_400Regular', // grosse Beträge
  serifBold: 'Newsreader_700Bold', // Wordmark "spendly"
};

// Tabellarische Ziffern: alle Zahlen sind gleich breit,
// dadurch stehen Beträge in Listen sauber untereinander.
const tabular = { fontVariant: ['tabular-nums'] };

export const typography = {
  // Grosse Serifen-Zahl, z. B. "CHF 24.50" auf der Übersicht
  displayHero: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 48, letterSpacing: -0.8, ...tabular },
  // Betrag im Formular
  currencyHero: { fontFamily: fonts.serif, fontSize: 48, lineHeight: 56, letterSpacing: -1, ...tabular },
  // Serifen-Titel, z. B. "Code eingeben"
  headlineLg: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, letterSpacing: -0.45 },
  headlineMd: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  headlineSm: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22 },
  bodyLg: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 24 },
  bodyMd: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20 },
  labelMd: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  // Kleinste erlaubte Schrift: 12
  labelSm: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.24 },
  // Beträge in Listen
  currencyMd: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, ...tabular },
  button: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22 },
};
