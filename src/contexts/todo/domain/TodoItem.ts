import { TodoDate } from "./TodoDate";
import { TodoTime } from "./TodoTime";
import { TodoTitle } from "./TodoTitle";

export interface TodoItemSnapshot {
  id: string;
  title: string;
  date: string;
  time: string | null;
  completed: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  googleTaskId: string | null;
}

export interface CreateTodoItemCommand {
  id: string;
  title: string;
  date: string;
  time?: string | null;
  displayOrder?: number;
  now: Date;
  googleTaskId?: string | null;
}

export class TodoItem {
  private constructor(
    private readonly id: string,
    private readonly title: TodoTitle,
    private readonly date: TodoDate,
    private readonly time: TodoTime | null,
    private readonly completed: boolean,
    private readonly displayOrder: number,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
    private readonly googleTaskId: string | null,
  ) {}

  public static create(command: CreateTodoItemCommand): TodoItem {
    return new TodoItem(
      command.id,
      TodoTitle.create(command.title),
      TodoDate.create(command.date),
      TodoTime.optional(command.time),
      false,
      TodoItem.validDisplayOrder(command.displayOrder ?? command.now.getTime()),
      command.now,
      command.now,
      command.googleTaskId ?? null,
    );
  }

  public static restore(snapshot: TodoItemSnapshot): TodoItem {
    return new TodoItem(
      snapshot.id,
      TodoTitle.create(snapshot.title),
      TodoDate.create(snapshot.date),
      TodoTime.optional(snapshot.time),
      snapshot.completed,
      TodoItem.displayOrderFromSnapshot(snapshot),
      new Date(snapshot.createdAt),
      new Date(snapshot.updatedAt),
      snapshot.googleTaskId,
    );
  }

  public get todoId(): string {
    return this.id;
  }

  public get todoDate(): string {
    return this.date.value;
  }

  public get todoMonth(): string {
    return this.date.monthKey();
  }

  public get todoTime(): string | null {
    return this.time?.value ?? null;
  }

  public get createdTime(): number {
    return this.createdAt.getTime();
  }

  public get todoDisplayOrder(): number {
    return this.displayOrder;
  }

  public get isCompleted(): boolean {
    return this.completed;
  }

  public complete(now: Date): TodoItem {
    return this.withCompletion(true, now);
  }

  public reopen(now: Date): TodoItem {
    return this.withCompletion(false, now);
  }

  public rename(title: string, now: Date): TodoItem {
    return new TodoItem(
      this.id,
      TodoTitle.create(title),
      this.date,
      this.time,
      this.completed,
      this.displayOrder,
      this.createdAt,
      now,
      this.googleTaskId,
    );
  }

  public reschedule(date: string, time: string | null, now: Date, displayOrder: number = this.displayOrder): TodoItem {
    return new TodoItem(
      this.id,
      this.title,
      TodoDate.create(date),
      TodoTime.optional(time),
      this.completed,
      TodoItem.validDisplayOrder(displayOrder),
      this.createdAt,
      now,
      this.googleTaskId,
    );
  }

  public moveToDisplayOrder(displayOrder: number, now: Date): TodoItem {
    return new TodoItem(
      this.id,
      this.title,
      this.date,
      this.time,
      this.completed,
      TodoItem.validDisplayOrder(displayOrder),
      this.createdAt,
      now,
      this.googleTaskId,
    );
  }

  public connectGoogleTask(googleTaskId: string, now: Date): TodoItem {
    return new TodoItem(
      this.id,
      this.title,
      this.date,
      this.time,
      this.completed,
      this.displayOrder,
      this.createdAt,
      now,
      googleTaskId,
    );
  }

  public snapshot(): TodoItemSnapshot {
    return {
      completed: this.completed,
      createdAt: this.createdAt.toISOString(),
      date: this.date.value,
      displayOrder: this.displayOrder,
      googleTaskId: this.googleTaskId,
      id: this.id,
      time: this.time?.value ?? null,
      title: this.title.value,
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  private withCompletion(completed: boolean, now: Date): TodoItem {
    return new TodoItem(
      this.id,
      this.title,
      this.date,
      this.time,
      completed,
      this.displayOrder,
      this.createdAt,
      now,
      this.googleTaskId,
    );
  }

  private static displayOrderFromSnapshot(snapshot: TodoItemSnapshot): number {
    const legacySnapshot = snapshot as TodoItemSnapshot & { displayOrder?: number };
    return TodoItem.validDisplayOrder(legacySnapshot.displayOrder ?? new Date(snapshot.createdAt).getTime());
  }

  private static validDisplayOrder(displayOrder: number): number {
    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      throw new Error("Todo display order must be a non-negative integer.");
    }

    return displayOrder;
  }
}
