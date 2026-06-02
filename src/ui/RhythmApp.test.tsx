import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RhythmStatusSnapshot } from "../contexts/rhythm/application/RhythmStatusSnapshot";
import { UserPreferences as Preferences } from "../contexts/preferences/domain/UserPreferences";
import type { TodoDaySummary } from "../contexts/todo/domain/TodoList";
import type { TodoItemSnapshot } from "../contexts/todo/domain/TodoItem";
import { RhythmApp } from "./RhythmApp";
import type { GoogleTaskListSnapshot, RhythmAppServices } from "./RhythmAppServices";

function runningStatus(): RhythmStatusSnapshot {
  return {
    sessionStatus: "running",
    focusMinutes: 50,
    restMinutes: 10,
    dailyStart: "05:00",
    dailyEnd: "18:00",
    autoStartEnabled: false,
    notificationSound: Preferences.default().notificationSound,
  };
}

function pausedStatus(): RhythmStatusSnapshot {
  return { ...runningStatus(), sessionStatus: "paused" };
}

function stoppedForTodayStatus(): RhythmStatusSnapshot {
  return { ...runningStatus(), sessionStatus: "stoppedForToday" };
}

function createServices(): RhythmAppServices {
  const todos: Array<TodoItemSnapshot> = [];

  return {
    startRhythm: { execute: vi.fn(() => Promise.resolve(runningStatus())) },
    pauseRhythm: { execute: vi.fn(() => Promise.resolve(pausedStatus())) },
    resumeRhythm: { execute: vi.fn(() => Promise.resolve(runningStatus())) },
    stopForToday: { execute: vi.fn(() => Promise.resolve(stoppedForTodayStatus())) },
    getStatus: { execute: vi.fn(() => runningStatus()) },
    updatePreferences: { execute: vi.fn(() => Promise.resolve()) },
    chooseCustomNotificationSound: { execute: vi.fn(() => Promise.resolve(Preferences.default())) },
    muteNotificationSound: { execute: vi.fn(() => Promise.resolve(Preferences.default().muteNotificationSound())) },
    previewNotificationSound: { execute: vi.fn(() => Promise.resolve()) },
    useDefaultNotificationSound: { execute: vi.fn(() => Promise.resolve(Preferences.default())) },
    addTodo: {
      execute: vi.fn((command: { title: string; date: string; time?: string | null }) => {
        const todo: TodoItemSnapshot = {
          completed: false,
          createdAt: "2026-06-02T05:10:00.000Z",
          date: command.date,
          googleTaskId: null,
          id: `todo-${todos.length + 1}`,
          time: command.time ?? null,
          title: command.title,
          updatedAt: "2026-06-02T05:10:00.000Z",
        };
        todos.push(todo);
        return Promise.resolve(todo);
      }),
    },
    deleteTodo: { execute: vi.fn(() => Promise.resolve()) },
    getTodoCalendarSummary: { execute: vi.fn(() => Promise.resolve({} as Record<string, TodoDaySummary>)) },
    getTodosByDate: { execute: vi.fn(() => Promise.resolve(todos)) },
    toggleTodo: { execute: vi.fn(() => Promise.resolve(todos[0])) },
    updateTodo: { execute: vi.fn(() => Promise.resolve(todos[0])) },
    beginGoogleAuthorization: { execute: vi.fn(() => Promise.resolve("https://accounts.google.com/mock")) },
    completeGoogleAuthorization: { execute: vi.fn(() => Promise.resolve()) },
    listGoogleTaskLists: { execute: vi.fn(() => Promise.resolve([] as Array<GoogleTaskListSnapshot>)) },
    saveGoogleClientId: { execute: vi.fn(() => Promise.resolve()) },
    selectGoogleTaskList: { execute: vi.fn(() => Promise.resolve()) },
    syncGoogleTodos: { execute: vi.fn(() => Promise.resolve({ imported: 0, updated: 0, uploaded: 0 })) },
  };
}

describe("RhythmApp", () => {
  it("renders the live clock and editable rhythm settings", () => {
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    expect(screen.getByText("05 : 10 : 00")).toBeInTheDocument();
    expect(screen.getByLabelText("집중 시간")).toHaveValue(50);
    expect(screen.getByLabelText("휴식 시간")).toHaveValue(10);
    expect(screen.getByLabelText("하루 시작")).toHaveValue("05:00");
    expect(screen.getByLabelText("하루 종료")).toHaveValue("18:00");
  });

  it("delegates start and pause commands to use cases", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(screen.getByRole("button", { name: "시작" }));
    await user.click(screen.getByRole("button", { name: "일시정지" }));

    expect(services.startRhythm.execute).toHaveBeenCalledOnce();
    expect(services.pauseRhythm.execute).toHaveBeenCalledOnce();
  });

  it("adds a simple today todo below the clock", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.type(screen.getByLabelText("오늘 할 일 입력"), "보고서 정리");
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(services.addTodo.execute).toHaveBeenCalledWith({
      date: "2026-06-02",
      time: null,
      title: "보고서 정리",
    });
    expect(await screen.findByText("보고서 정리")).toBeInTheDocument();
  });
});
