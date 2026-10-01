import { useEffect, useState } from 'react';

// Die Anzeige zählt nur herunter; die verbindliche Prüfung geschieht im SecureStore.
export default function usePinLockout(lockedUntil) {
  // Aktuelle Zeit. Sie wird während der Sperre alle 250 ms neu gelesen.
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    // Keine Sperre: Es ist kein Timer nötig
    if (!lockedUntil) return undefined;
    // Alle 0.25 Sekunden die Zeit neu lesen, damit der Countdown weiterläuft
    const timer = setInterval(() => setNow(Date.now()), 250);
    // Aufräumen: Timer stoppen
    return () => clearInterval(timer);
  }, [lockedUntil]);
  // Restsekunden, aufgerundet und nie negativ
  return Math.max(0, Math.ceil((lockedUntil - now) / 1000));
}
