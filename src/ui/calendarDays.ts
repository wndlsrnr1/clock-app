export interface CalendarDayCell {
  date: string | null;
  day: number | null;
  isCurrentMonth: boolean;
}

const CALENDAR_CELL_COUNT = 42;

export function calendarDays(month: string): Array<CalendarDayCell> {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();

  return Array.from({ length: CALENDAR_CELL_COUNT }, (_: unknown, index: number): CalendarDayCell => {
    const day = index - firstWeekday + 1;

    if (day < 1 || day > lastDay) {
      return { date: null, day: null, isCurrentMonth: false };
    }

    return {
      date: `${month}-${String(day).padStart(2, "0")}`,
      day,
      isCurrentMonth: true,
    };
  });
}
