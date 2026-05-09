// utils/dateUtils.ts
export function getCurrentWorkWeek(): Date[] {
  const now = new Date();
  const day = now.getDay(); // Sunday=0, Monday=1 ... Saturday=6

  // Calculate Monday (start of week)
  // If Sunday (0), shift back 6 days to Monday previous week
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));

  // Build array of Monday to Sunday (7 days)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function getNextWorkWeek(startDate: Date): Date[] {
  const nextWeekStart = new Date(startDate);
  nextWeekStart.setDate(startDate.getDate() + 7);
  const day = nextWeekStart.getDay();
  const monday = new Date(nextWeekStart);
  monday.setDate(nextWeekStart.getDate() - (day === 0 ? 6 : day - 1));

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function getPreviousWorkWeek(startDate: Date): Date[] {
  const prevWeekStart = new Date(startDate);
  prevWeekStart.setDate(startDate.getDate() - 7);
  const day = prevWeekStart.getDay();
  const monday = new Date(prevWeekStart);
  monday.setDate(prevWeekStart.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDate(dateStr: string): Date {
  const parsed = parseTaskDate(dateStr);
  if (!parsed) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  return parsed;
}

export function parseDateOnly(dateStr: string): Date | null {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!dateOnlyMatch) return null;

  const [, year, month, day] = dateOnlyMatch;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseTaskDate(value: Date | string | undefined): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value);
  }

  const dateOnly = parseDateOnly(value);
  if (dateOnly) return dateOnly;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toDateOnlyKey(value: Date | string | undefined): string | null {
  const parsed = parseTaskDate(value);
  if (!parsed) return null;
  return formatDate(parsed);
}

export function isSameDate(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}