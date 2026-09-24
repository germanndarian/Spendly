// Demo-Daten für die Präsentation. Der Knopf dazu steht in den Einstellungen
// und ist nur im Entwicklungsmodus (__DEV__) sichtbar.
import * as Crypto from 'expo-crypto';
import { toISODate } from '../utils/format';

// Typische Ausgaben aus dem Alltag: [Beschreibung, Kategorie, Betrag in Rappen]
const TEMPLATES = [
  ['Migros', 'food', 2340],
  ['SBB Mobile', 'transport', 880],
  ['Coop to go', 'food', 1290],
  ['Spotify Premium', 'subscriptions', 1395],
  ['Kaffee Mensa', 'food', 450],
  ['Kino Arena', 'leisure', 1950],
  ['Denner', 'food', 1875],
  ['Zvieri Bäckerei', 'food', 620],
  ['Hallenbad', 'leisure', 800],
  ['H&M', 'shopping', 3990],
  ['Postauto', 'transport', 640],
  ['Netflix', 'subscriptions', 1790],
  ['Döner Kebab', 'food', 1200],
  ['Velo Ersatzteile', 'transport', 2450],
  ['Bücher Orell Füssli', 'shopping', 2890],
  ['Fitnessabo', 'subscriptions', 4900],
  ['Apotheke', 'other', 1650],
  ['Starbucks', 'food', 760],
  ['Konzert Ticket', 'leisure', 4500],
  ['Migrolino', 'food', 940],
  ['Tramticket', 'transport', 420],
  ['Geschenk für Mama', 'shopping', 3500],
];

// Erzeugt rund 40 Ausgaben, verteilt über den laufenden Monat bis heute.
// Nie in der Zukunft – das wäre laut Validierung ungültig.
export function createDemoExpenses(today = new Date()) {
  const expenses = [];
  let index = 0;

  for (let day = 1; day <= today.getDate(); day++) {
    // An jedem dritten Tag zwei Ausgaben, sonst eine
    const count = day % 3 === 0 ? 2 : 1;

    for (let i = 0; i < count; i++) {
      const [description, category, amountRappen] = TEMPLATES[index % TEMPLATES.length];
      const date = new Date(today.getFullYear(), today.getMonth(), day);
      expenses.push({
        id: Crypto.randomUUID(),
        amountRappen,
        category,
        description,
        date: toISODate(date),
        // Uhrzeit nur, damit mehrere Ausgaben am gleichen Tag eine Reihenfolge haben
        createdAt: new Date(today.getFullYear(), today.getMonth(), day, 9 + i * 5).getTime(),
      });
      index++;
    }
  }

  return expenses;
}
