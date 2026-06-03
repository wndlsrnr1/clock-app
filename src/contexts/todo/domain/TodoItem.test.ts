import { describe, expect, it } from "vitest";
import { TodoItem, type TodoItemSnapshot } from "./TodoItem";
import { TodoList } from "./TodoList";
import { TodoTitle } from "./TodoTitle";

describe("TodoItem", () => {
  it("creates a simple date-only todo by default", () => {
    const todo = TodoItem.create({
      date: "2026-06-02",
      displayOrder: 0,
      id: "todo-1",
      now: new Date("2026-06-02T09:00:00"),
      title: "과제 정리",
    });

    expect(todo.snapshot()).toMatchObject({
      completed: false,
      date: "2026-06-02",
      displayOrder: 0,
      id: "todo-1",
      time: null,
      title: "과제 정리",
    });
  });

  it("can add an optional time and complete the todo", () => {
    const todo = TodoItem.create({
      date: "2026-06-02",
      displayOrder: 0,
      id: "todo-1",
      now: new Date("2026-06-02T09:00:00"),
      time: "14:30",
      title: "운동",
    }).complete(new Date("2026-06-02T10:00:00"));

    expect(todo.snapshot().time).toBe("14:30");
    expect(todo.snapshot().completed).toBe(true);
  });

  it("requires a meaningful title", () => {
    expect(() => TodoItem.create({
      date: "2026-06-02",
      displayOrder: 0,
      id: "todo-1",
      now: new Date("2026-06-02T09:00:00"),
      title: " ",
    })).toThrow("Todo title is required.");
  });

  it("publishes the title length limit used by input validation", () => {
    expect(TodoItem.create({
      date: "2026-06-02",
      displayOrder: 0,
      id: "todo-long",
      now: new Date("2026-06-02T09:00:00"),
      title: "가".repeat(TodoTitle.maxLength),
    }).snapshot().title).toHaveLength(TodoTitle.maxLength);

    expect(() => TodoItem.create({
      date: "2026-06-02",
      displayOrder: 0,
      id: "todo-too-long",
      now: new Date("2026-06-02T09:00:00"),
      title: "가".repeat(TodoTitle.maxLength + 1),
    })).toThrow("Todo title must be 160 characters or less.");
  });

  it("restores legacy todos without display order from their created time", () => {
    const todo = TodoItem.restore({
      completed: false,
      createdAt: "2026-06-02T09:03:00.000Z",
      date: "2026-06-02",
      id: "todo-1",
      time: null,
      title: "기존 할 일",
      updatedAt: "2026-06-02T09:03:00.000Z",
    } as TodoItemSnapshot);

    expect(todo.snapshot().displayOrder).toBe(new Date("2026-06-02T09:03:00.000Z").getTime());
  });
});

describe("TodoList", () => {
  it("sorts incomplete todos before completed todos by display order without time priority", () => {
    const todos = [
      TodoItem.create({ date: "2026-06-02", displayOrder: 2, id: "todo-1", now: new Date("2026-06-02T09:03:00"), time: "09:00", title: "세 번째" }),
      TodoItem.create({ date: "2026-06-02", displayOrder: 0, id: "todo-2", now: new Date("2026-06-02T09:02:00"), time: "18:00", title: "첫 번째" }),
      TodoItem.create({ date: "2026-06-02", displayOrder: 1, id: "todo-3", now: new Date("2026-06-02T09:01:00"), title: "두 번째" }),
      TodoItem.create({ date: "2026-06-02", displayOrder: 3, id: "todo-4", now: new Date("2026-06-02T09:00:00"), title: "완료" })
        .complete(new Date("2026-06-02T10:00:00")),
    ];

    const sortedTitles = TodoList.from(todos).forDate("2026-06-02").map((todo) => todo.title);

    expect(sortedTitles).toEqual(["첫 번째", "두 번째", "세 번째", "완료"]);
  });

  it("summarizes todo counts for a calendar month", () => {
    const todos = [
      TodoItem.create({ date: "2026-06-02", displayOrder: 0, id: "todo-1", now: new Date("2026-06-02T09:00:00"), title: "A" }),
      TodoItem.create({ date: "2026-06-02", displayOrder: 1, id: "todo-2", now: new Date("2026-06-02T09:00:00"), title: "B" }).complete(new Date("2026-06-02T10:00:00")),
      TodoItem.create({ date: "2026-06-03", displayOrder: 0, id: "todo-3", now: new Date("2026-06-02T09:00:00"), title: "C" }),
    ];

    const summary = TodoList.from(todos).calendarSummary("2026-06");

    expect(summary).toEqual({
      "2026-06-02": { completed: 1, total: 2 },
      "2026-06-03": { completed: 0, total: 1 },
    });
  });
});
