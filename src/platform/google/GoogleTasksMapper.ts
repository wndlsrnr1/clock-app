import { TodoItem } from "../../contexts/todo/domain/TodoItem";

export interface GoogleTaskResource {
  id: string;
  title?: string;
  status?: "needsAction" | "completed";
  due?: string;
}

export interface GoogleTaskPayload {
  title: string;
  status: "needsAction" | "completed";
  due: string;
}

export class GoogleTasksMapper {
  public static toGoogleTaskPayload(todo: TodoItem): GoogleTaskPayload {
    const snapshot = todo.snapshot();

    return {
      due: `${snapshot.date}T00:00:00.000Z`,
      status: snapshot.completed ? "completed" : "needsAction",
      title: snapshot.title,
    };
  }

  public static fromGoogleTask(task: GoogleTaskResource, identity: { displayOrder: number; id: string; now: Date }): TodoItem {
    const dueDate = GoogleTasksMapper.localDueDate(task, identity.now);
    const todo = TodoItem.create({
      date: dueDate,
      displayOrder: identity.displayOrder,
      googleTaskId: task.id,
      id: identity.id,
      now: identity.now,
      title: task.title ?? "제목 없는 Google 할 일",
    });

    if (task.status === "completed") {
      return todo.complete(identity.now);
    }

    return todo;
  }

  public static localDueDate(task: GoogleTaskResource, fallbackNow: Date): string {
    return task.due?.slice(0, 10) ?? fallbackNow.toISOString().slice(0, 10);
  }
}
