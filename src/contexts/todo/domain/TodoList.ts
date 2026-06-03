import type { TodoItem, TodoItemSnapshot } from "./TodoItem";

export interface TodoDaySummary {
  total: number;
  completed: number;
}

export class TodoList {
  private constructor(private readonly todos: Array<TodoItem>) {}

  public static from(todos: Array<TodoItem>): TodoList {
    return new TodoList([...todos]);
  }

  public forDate(date: string): Array<TodoItemSnapshot> {
    return this.todos
      .filter((todo: TodoItem): boolean => todo.todoDate === date)
      .sort(TodoList.compareForDailyView)
      .map((todo: TodoItem): TodoItemSnapshot => todo.snapshot());
  }

  public calendarSummary(month: string): Record<string, TodoDaySummary> {
    return this.todos
      .filter((todo: TodoItem): boolean => todo.todoMonth === month)
      .reduce<Record<string, TodoDaySummary>>((summary: Record<string, TodoDaySummary>, todo: TodoItem): Record<string, TodoDaySummary> => {
        const snapshot = todo.snapshot();
        const currentSummary = summary[snapshot.date] ?? { completed: 0, total: 0 };

        return {
          ...summary,
          [snapshot.date]: {
            completed: currentSummary.completed + (snapshot.completed ? 1 : 0),
            total: currentSummary.total + 1,
          },
        };
      }, {});
  }

  private static compareForDailyView(left: TodoItem, right: TodoItem): number {
    if (left.isCompleted !== right.isCompleted) {
      return left.isCompleted ? 1 : -1;
    }

    if (left.todoDisplayOrder !== right.todoDisplayOrder) {
      return left.todoDisplayOrder - right.todoDisplayOrder;
    }

    return left.createdTime - right.createdTime;
  }
}
