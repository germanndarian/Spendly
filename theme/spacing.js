// Abstände, Radien und Mindestgrössen (8pt-Raster)

export const spacing = {
  xs: 4, // halber Schritt für Feinabstimmung
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  screen: 20, // seitlicher Rand auf allen Screens
};

export const radius = {
  card: 16, // Karten
  control: 12, // Buttons und Eingabefelder
  pill: 999, // runde Chips und Punkte
};

// Jedes tippbare Element ist mindestens 48pt hoch (iOS 44pt + Android 48dp erfüllt)
export const TOUCH_MIN = 48;
