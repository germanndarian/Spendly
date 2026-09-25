// Die sechs Kategorien von Spendly.
// "id" wird gespeichert (englisch, stabil), "label" wird angezeigt (deutsch).
import { categoryColors } from '../theme/colors';

export const CATEGORIES = [
  { id: 'food', label: 'Essen & Trinken', color: categoryColors.food },
  { id: 'transport', label: 'Mobilität', color: categoryColors.transport },
  { id: 'leisure', label: 'Freizeit', color: categoryColors.leisure },
  { id: 'shopping', label: 'Shopping', color: categoryColors.shopping },
  { id: 'subscriptions', label: 'Abos', color: categoryColors.subscriptions },
  { id: 'other', label: 'Sonstiges', color: categoryColors.other },
];

// Sucht eine Kategorie anhand der id. Unbekannte ids landen bei "Sonstiges".
export function getCategory(id) {
  // find sucht den ersten Eintrag mit passender id. Findet es nichts,
  // nimmt ?? den letzten Eintrag der Liste (Sonstiges).
  return CATEGORIES.find((category) => category.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
