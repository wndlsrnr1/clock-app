export class TodoTitle {
  private constructor(public readonly value: string) {}

  public static create(value: string): TodoTitle {
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      throw new Error("Todo title is required.");
    }

    if (trimmedValue.length > 160) {
      throw new Error("Todo title must be 160 characters or less.");
    }

    return new TodoTitle(trimmedValue);
  }
}
