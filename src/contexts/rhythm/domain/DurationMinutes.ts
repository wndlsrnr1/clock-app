export class DurationMinutes {
  private constructor(public readonly value: number) {}

  public static create(value: number): DurationMinutes {
    if (!Number.isInteger(value) || value < 1 || value > 1440) {
      throw new Error("Duration must be between 1 and 1440 minutes.");
    }

    return new DurationMinutes(value);
  }
}

