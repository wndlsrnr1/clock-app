export class ClockTime {
  private constructor(private readonly minutesFromMidnight: number) {}

  public static fromText(value: string): ClockTime {
    const [hourText, minuteText] = value.split(":");
    const hour = Number(hourText);
    const minute = Number(minuteText);

    return ClockTime.fromNumbers(hour, minute);
  }

  public static fromNumbers(hour: number, minute: number): ClockTime {
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      throw new Error("Hour must be between 0 and 23.");
    }

    if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
      throw new Error("Minute must be between 0 and 59.");
    }

    return new ClockTime(hour * 60 + minute);
  }

  public static fromDate(date: Date): ClockTime {
    return ClockTime.fromNumbers(date.getHours(), date.getMinutes());
  }

  public get totalMinutes(): number {
    return this.minutesFromMidnight;
  }

  public get hour(): number {
    return Math.floor(this.minutesFromMidnight / 60);
  }

  public get minute(): number {
    return this.minutesFromMidnight % 60;
  }

  public toText(): string {
    return `${String(this.hour).padStart(2, "0")}:${String(this.minute).padStart(2, "0")}`;
  }
}

