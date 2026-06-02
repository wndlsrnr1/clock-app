export class TodoDate {
  private constructor(public readonly value: string) {}

  public static create(value: string): TodoDate {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error("Todo date must use YYYY-MM-DD format.");
    }

    return new TodoDate(value);
  }

  public monthKey(): string {
    return this.value.slice(0, 7);
  }
}
