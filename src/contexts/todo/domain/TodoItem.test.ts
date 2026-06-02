import { describe, expect, it } from "vitest";
import { TodoItem } from "./TodoItem";
import { TodoList } from "./TodoList";

describe("TodoItem", () => {
  it("creates a simple date-only todo by default", () => {
    const todo = TodoItem.create({
      date: "2026-06-02",
      id: "todo-1",
      now: new Date("2026-06-02T09:00:00"),
      title: "과제 정리",
    });

    expect(todo.snapshot()).toMatchObject({
      completed: false,
      date: "2026-06-02",
      id: "todo-1",
      time: null,
      title: "과제 정리",
    });
  });

  it("can add an optional time and complete the todo", () => {
    const todo = TodoItem.create({
      date: "2026-06-02",
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
      id: "todo-1",
      now: new Date("2026-06-02T09:00:00"),
      title: " ",
    })).toThrow("Todo title is required.");
  });
});

describe("TodoList", () => {
  it("sorts timed todos first by time and untimed todos by creation order", () => {
    const todos = [
      TodoItem.create({ date: "2026-06-02", id: "todo-1", now: new Date("2026-06-02T09:03:00"), title: "시간 없음 2" }),
      TodoItem.create({ date: "2026-06-02", id: "todo-2", now: new Date("2026-06-02T09:02:00"), time: "13:00", title: "점심 후" }),
      TodoItem.create({ date: "2026-06-02", id: "todo-3", now: new Date("2026-06-02T09:01:00"), time: "10:00", title: "오전" }),
      TodoItem.create({ date: "2026-06-02", id: "todo-4", now: new Date("2026-06-02T09:00:00"), title: "시간 없음 1" }),
    ];

    const sortedTitles = TodoList.from(todos).forDate("2026-06-02").map((todo) => todo.title);

    expect(sortedTitles).toEqual(["오전", "점심 후", "시간 없음 1", "시간 없음 2"]);
  });

  it("summarizes todo counts for a calendar month", () => {
    const todos = [
      TodoItem.create({ date: "2026-06-02", id: "todo-1", now: new Date("2026-06-02T09:00:00"), title: "A" }),
      TodoItem.create({ date: "2026-06-02", id: "todo-2", now: new Date("2026-06-02T09:00:00"), title: "B" }).complete(new Date("2026-06-02T10:00:00")),
      TodoItem.create({ date: "2026-06-03", id: "todo-3", now: new Date("2026-06-02T09:00:00"), title: "C" }),
    ];

    const summary = TodoList.from(todos).calendarSummary("2026-06");

    expect(summary).toEqual({
      "2026-06-02": { completed: 1, total: 2 },
      "2026-06-03": { completed: 0, total: 1 },
    });
  });
});
