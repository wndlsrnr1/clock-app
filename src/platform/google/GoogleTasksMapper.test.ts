import { describe, expect, it } from "vitest";
import { TodoItem } from "../../contexts/todo/domain/TodoItem";
import { GoogleTasksMapper } from "./GoogleTasksMapper";

describe("GoogleTasksMapper", () => {
  it("drops local todo time when creating a Google Tasks payload", () => {
    const todo = TodoItem.create({
      date: "2026-06-02",
      id: "todo-1",
      now: new Date("2026-06-02T09:00:00"),
      time: "14:30",
      title: "운동",
    });

    const payload = GoogleTasksMapper.toGoogleTaskPayload(todo);

    expect(payload).toEqual({
      due: "2026-06-02T00:00:00.000Z",
      status: "needsAction",
      title: "운동",
    });
  });

  it("imports Google Tasks due date as a date-only local todo", () => {
    const todo = GoogleTasksMapper.fromGoogleTask({
      due: "2026-06-02T00:00:00.000Z",
      id: "google-1",
      status: "completed",
      title: "Google 할 일",
    }, {
      id: "todo-1",
      now: new Date("2026-06-02T09:00:00"),
    });

    expect(todo.snapshot()).toMatchObject({
      completed: true,
      date: "2026-06-02",
      googleTaskId: "google-1",
      time: null,
      title: "Google 할 일",
    });
  });
});
