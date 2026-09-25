// Automatisch sperren: Wie lange darf die App im Hintergrund sein?
// Die Sperrzeit stellt jede Person selbst ein (Konzept: Individualisierbarkeit).
// minutes = null bedeutet "Nie".

export const AUTO_LOCK_OPTIONS = [
  { minutes: 0, label: 'Sofort' },
  { minutes: 1, label: 'Nach 1 Minute' },
  { minutes: 5, label: 'Nach 5 Minuten' },
  { minutes: null, label: 'Nie' },
];

// Text für die Einstellungen, z. B. "Nach 1 Minute"
export function getAutoLockLabel(minutes) {
  const option = AUTO_LOCK_OPTIONS.find((item) => item.minutes === minutes);
  return option ? option.label : AUTO_LOCK_OPTIONS[1].label;
}

// Muss die App beim Zurückkommen gesperrt werden?
// backgroundSince: Zeitpunkt (ms), seit dem die App im Hintergrund war, oder null
export function shouldAutoLock(backgroundSince, now, minutes) {
  if (minutes === null || backgroundSince === null) return false;
  // Zeit im Hintergrund (in ms) mit der Sperrzeit vergleichen (Minuten × 60 × 1000)
  return now - backgroundSince >= minutes * 60 * 1000;
}
