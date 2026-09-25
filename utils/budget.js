// Budget-Berechnungen (reine Funktionen, alles in Rappen).

// Anzahl Tage im Monat des Datums (Tag 0 des nächsten Monats = letzter Tag)
export function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// Verbleibende Tage im Monat, heute mitgezählt (am 23. Sept. → 8)
export function getRemainingDays(today) {
  return getDaysInMonth(today) - today.getDate() + 1;
}

// Alle Kennzahlen für die Übersicht auf einmal
export function getBudgetStatus(budgetRappen, spentRappen, today = new Date()) {
  const daysInMonth = getDaysInMonth(today);
  const remainingDays = getRemainingDays(today);
  // Wie viel vom Budget noch übrig ist (negativ = überschritten)
  const remainingRappen = budgetRappen - spentRappen;
  const isOverBudget = remainingRappen < 0;

  // "Auf Kurs" = nicht mehr ausgegeben, als bis heute anteilig geplant war
  const plannedUntilToday = (budgetRappen * today.getDate()) / daysInMonth;

  return {
    remainingDays,
    remainingRappen,
    isOverBudget,
    overByRappen: isOverBudget ? -remainingRappen : 0,
    // "Heute noch frei" = (Budget − ausgegeben) / verbleibende Tage.
    // Abrunden: lieber einen Rappen zu wenig anzeigen als zu viel.
    dailyAllowanceRappen: isOverBudget ? 0 : Math.floor(remainingRappen / remainingDays),
    // Durchschnittliches Tagesbudget – Grenze für den roten Punkt im Monatsstreifen
    dailyBudgetRappen: Math.floor(budgetRappen / daysInMonth),
    // Anteil ausgegeben: 0.5 = 50 %. Bei einem Budget von 0 nicht durch 0 teilen.
    progress: budgetRappen > 0 ? spentRappen / budgetRappen : 0,
    isOnTrack: !isOverBudget && spentRappen <= plannedUntilToday,
  };
}
