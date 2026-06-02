export interface CalendarDayCell {
  date: string;
  day: number;
}

export function calendarDays(month: string): Array<CalendarDayCell> {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();

  return Array.from({ length: lastDay }, (_: unknown, index: number): CalendarDayCell => {
    const day = index + 1;
    return {
      date: `${month}-${String(day).padStart(2, "0")}`,
      day,
    };
  });
}
