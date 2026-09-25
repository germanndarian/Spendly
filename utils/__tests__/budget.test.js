// Unit-Tests für utils/budget.js
// Die Zahlen stammen aus dem Mockup: Budget CHF 800.00, am 23. September
// sind CHF 604.00 ausgegeben → "Heute noch frei: CHF 24.50".
import { getBudgetStatus, getDaysInMonth, getRemainingDays } from '../budget';

const SEPT_23 = new Date(2026, 8, 23);

describe('getDaysInMonth', () => {
  test('kennt die Länge jedes Monats', () => {
    expect(getDaysInMonth(new Date(2026, 8, 1))).toBe(30); // September
    expect(getDaysInMonth(new Date(2026, 9, 15))).toBe(31); // Oktober
    expect(getDaysInMonth(new Date(2026, 1, 10))).toBe(28); // Februar
  });

  test('berücksichtigt Schaltjahre', () => {
    expect(getDaysInMonth(new Date(2028, 1, 10))).toBe(29);
  });
});

describe('getRemainingDays', () => {
  test('zählt heute mit', () => {
    expect(getRemainingDays(SEPT_23)).toBe(8);
    expect(getRemainingDays(new Date(2026, 8, 1))).toBe(30);
    expect(getRemainingDays(new Date(2026, 8, 30))).toBe(1);
  });
});

describe('getBudgetStatus', () => {
  test('rechnet "Heute noch frei" wie im Mockup', () => {
    const status = getBudgetStatus(80000, 60400, SEPT_23);
    expect(status.remainingDays).toBe(8);
    expect(status.remainingRappen).toBe(19600);
    expect(status.dailyAllowanceRappen).toBe(2450); // CHF 24.50
    expect(status.isOverBudget).toBe(false);
    expect(status.overByRappen).toBe(0);
    expect(status.progress).toBeCloseTo(0.755);
  });

  test('rundet das Tagesbudget ab (lieber einen Rappen zu wenig)', () => {
    // CHF 100.00 auf 3 Tage = 33.333… → 33.33
    const status = getBudgetStatus(10000, 0, new Date(2026, 8, 28));
    expect(status.dailyAllowanceRappen).toBe(3333);
  });

  test('erkennt ein überschrittenes Budget', () => {
    const status = getBudgetStatus(80000, 85000, SEPT_23);
    expect(status.isOverBudget).toBe(true);
    expect(status.overByRappen).toBe(5000); // CHF 50.00
    expect(status.dailyAllowanceRappen).toBe(0);
    expect(status.progress).toBeGreaterThan(1);
    expect(status.isOnTrack).toBe(false);
  });

  test('genau auf dem Budget ist noch nicht überschritten', () => {
    const status = getBudgetStatus(80000, 80000, SEPT_23);
    expect(status.isOverBudget).toBe(false);
    expect(status.dailyAllowanceRappen).toBe(0);
  });

  test('"Auf Kurs", solange nicht mehr als anteilig geplant ausgegeben wurde', () => {
    // Bis zum 23. von 30 Tagen sind CHF 613.33 eingeplant
    expect(getBudgetStatus(80000, 60000, SEPT_23).isOnTrack).toBe(true);
    expect(getBudgetStatus(80000, 70000, SEPT_23).isOnTrack).toBe(false);
  });

  test('Tagesbudget für den roten Punkt im Monatsstreifen', () => {
    // CHF 800.00 / 30 Tage = 26.666… → 26.66
    expect(getBudgetStatus(80000, 0, SEPT_23).dailyBudgetRappen).toBe(2666);
  });

  test('ein Budget von 0 führt nicht zu einer Division durch 0', () => {
    expect(getBudgetStatus(0, 0, SEPT_23).progress).toBe(0);
  });
});
