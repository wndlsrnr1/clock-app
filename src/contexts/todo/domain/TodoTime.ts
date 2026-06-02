export class TodoTime {
  private constructor(public readonly value: string) {}

  public static optional(value: string | null | undefined): TodoTime | null {
    if (!value) {
      return null;
    }

    if (!/^\d{2}:\d{2}$/.test(value)) {
      throw new Error("Todo time must use HH:mm format.");
    }

    const [hourText, minuteText] = value.split(":");
    const hour = Number(hourText);
    const minute = Number(minuteText);

    if (hour > 23 || minute > 59) {
      throw new Error("Todo time must use HH:mm format.");
    }

    return new TodoTime(value);
  }
}
