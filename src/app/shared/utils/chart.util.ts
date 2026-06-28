export interface MonthlyPoint {
  year?: number;
  month?: number;
  monthLabel?: string;
}

export function sortMonthlyChronologically<T extends MonthlyPoint>(points: T[]): T[] {
  return [...points].sort((a, b) => {
    if (a.year != null && b.year != null && a.month != null && b.month != null) {
      return a.year - b.year || a.month - b.month;
    }
    return (a.monthLabel ?? '').localeCompare(b.monthLabel ?? '');
  });
}
