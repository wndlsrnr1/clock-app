export class TodoTitle {
  public static readonly maxLength = 160;

  private constructor(public readonly value: string) {}

  public static create(value: string): TodoTitle {
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      throw new Error("Todo title is required.");
    }

    if (trimmedValue.length > TodoTitle.maxLength) {
      throw new Error(`Todo title must be ${TodoTitle.maxLength} characters or less.`);
    }

    return new TodoTitle(trimmedValue);
  }
}
