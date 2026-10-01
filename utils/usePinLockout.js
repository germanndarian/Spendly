import { useEffect, useState } from 'react';

// Die Anzeige zählt nur herunter; die verbindliche Prüfung geschieht im SecureStore.
export default function usePinLockout(lockedUntil) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!lockedUntil) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [lockedUntil]);
  return Math.max(0, Math.ceil((lockedUntil - now) / 1000));
}
