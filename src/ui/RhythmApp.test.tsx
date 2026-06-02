import { act, fireEvent, render, screen } from "@testing-library/react";
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
    language: "kor",
  };
}

function idleStatus(): RhythmStatusSnapshot {
  return { ...runningStatus(), sessionStatus: "idle" };
}

function pausedStatus(): RhythmStatusSnapshot {
  return { ...runningStatus(), sessionStatus: "paused" };
}

function stoppedForTodayStatus(): RhythmStatusSnapshot {
  return { ...runningStatus(), sessionStatus: "stoppedForToday" };
}

function createServices(initialTodos: Array<TodoItemSnapshot> = []): RhythmAppServices {
  const todos: Array<TodoItemSnapshot> = [...initialTodos];

  return {
    startRhythm: { execute: vi.fn(() => Promise.resolve(runningStatus())) },
    pauseRhythm: { execute: vi.fn(() => Promise.resolve(pausedStatus())) },
    resumeRhythm: { execute: vi.fn(() => Promise.resolve(runningStatus())) },
    stopForToday: { execute: vi.fn(() => Promise.resolve(stoppedForTodayStatus())) },
    getStatus: { execute: vi.fn(() => idleStatus()) },
    updatePreferences: { execute: vi.fn(() => Promise.resolve(Preferences.default())) },
    chooseCustomNotificationSound: { execute: vi.fn(() => Promise.resolve(Preferences.default())) },
    muteNotificationSound: { execute: vi.fn(() => Promise.resolve(Preferences.default().toggleNotificationSoundMute())) },
    previewNotificationSound: { execute: vi.fn(() => Promise.resolve()) },
    stopNotificationSoundPreview: { execute: vi.fn(() => Promise.resolve()) },
    updateNotificationSoundVolume: { execute: vi.fn(() => Promise.resolve(Preferences.default().changeNotificationSoundVolume(0.4))) },
    useDefaultNotificationSound: { execute: vi.fn(() => Promise.resolve(Preferences.default())) },
    changeLanguage: { execute: vi.fn((language: "kor" | "en") => Promise.resolve(Preferences.default().changeLanguage(language))) },
    addTodo: {
      execute: vi.fn((command: { title: string; date: string; time?: string | null }) => {
        const todo: TodoItemSnapshot = {
          completed: false,
          createdAt: "2026-06-02T05:10:00.000Z",
          date: command.date,
          displayOrder: nextDisplayOrder(todos, command.date),
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
    getTodosByDate: { execute: vi.fn((date: string) => Promise.resolve(todos.filter((todo: TodoItemSnapshot): boolean => todo.date === date).sort(compareTodoSnapshots))) },
    reorderTodos: {
      execute: vi.fn((command: { date: string; orderedIds: Array<string> }) => {
        command.orderedIds.forEach((id: string, index: number): void => {
          const todo = todos.find((candidate: TodoItemSnapshot): boolean => candidate.id === id);
          if (todo) {
            todo.displayOrder = index;
          }
        });
        return Promise.resolve(todos.filter((todo: TodoItemSnapshot): boolean => todo.date === command.date).sort(compareTodoSnapshots));
      }),
    },
    toggleTodo: {
      execute: vi.fn((id: string) => {
        const todo = todos.find((candidate: TodoItemSnapshot): boolean => candidate.id === id);
        if (!todo) {
          return Promise.resolve(undefined);
        }
        todo.completed = !todo.completed;
        return Promise.resolve(todo);
      }),
    },
    updateTodo: {
      execute: vi.fn((command: { id: string; title: string; date: string; time: string | null }) => {
        const todo = todos.find((candidate: TodoItemSnapshot): boolean => candidate.id === command.id);
        if (!todo) {
          throw new Error("Todo was not found.");
        }
        todo.title = command.title;
        todo.date = command.date;
        todo.time = command.time;
        return Promise.resolve(todo);
      }),
    },
    beginGoogleAuthorization: { execute: vi.fn(() => Promise.resolve("https://accounts.google.com/mock")) },
    completeGoogleAuthorization: { execute: vi.fn(() => Promise.resolve()) },
    listGoogleTaskLists: { execute: vi.fn(() => Promise.resolve([] as Array<GoogleTaskListSnapshot>)) },
    saveGoogleClientId: { execute: vi.fn(() => Promise.resolve()) },
    selectGoogleTaskList: { execute: vi.fn(() => Promise.resolve()) },
    syncGoogleTodos: { execute: vi.fn(() => Promise.resolve({ imported: 0, updated: 0, uploaded: 0 })) },
  };
}

function compareTodoSnapshots(left: TodoItemSnapshot, right: TodoItemSnapshot): number {
  if (left.completed !== right.completed) {
    return left.completed ? 1 : -1;
  }

  return left.displayOrder - right.displayOrder;
}

function nextDisplayOrder(todos: Array<TodoItemSnapshot>, date: string): number {
  const displayOrders = todos
    .filter((todo: TodoItemSnapshot): boolean => todo.date === date)
    .map((todo: TodoItemSnapshot): number => todo.displayOrder);

  return displayOrders.length === 0 ? 0 : Math.max(...displayOrders) + 1;
}

describe("RhythmApp", () => {
  it("renders the live clock and editable rhythm settings", () => {
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    expect(screen.getByText("05 : 10 : 00")).toBeInTheDocument();
    expect(screen.getByLabelText("집중 시간")).toHaveValue(50);
    expect(screen.getByLabelText("휴식 시간")).toHaveValue(10);
    expect(screen.getByRole("button", { name: "하루 시작" })).toHaveTextContent("05:00");
    expect(screen.getByRole("button", { name: "하루 종료" })).toHaveTextContent("18:00");
    expect(screen.getByText("대기")).toBeInTheDocument();
    expect(screen.queryByText("idle")).not.toBeInTheDocument();
  });

  it("switches app copy between Korean and English", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    expect(screen.getByText("오늘 할 일")).toBeInTheDocument();
    expect(screen.queryByText("TODAY")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "English" }));

    expect(services.changeLanguage.execute).toHaveBeenCalledWith("en");
    expect(await screen.findByRole("heading", { name: "Today" })).toBeInTheDocument();
  });

  it("uses locale-independent time pickers for rhythm start and end", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(screen.getByRole("button", { name: "English" }));

    const dayStart = await screen.findByRole("button", { name: "Day start" });
    const dayEnd = await screen.findByRole("button", { name: "Day end" });

    expect(dayStart).toHaveTextContent("05:00");
    expect(dayEnd).toHaveTextContent("18:00");

    await user.click(dayStart);

    expect(screen.getByLabelText("Day start direct input")).toHaveValue("0500");
    expect(screen.queryByDisplayValue(/오전|오후/)).not.toBeInTheDocument();
  });

  it("delegates start and pause commands to use cases", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(screen.getByRole("button", { name: "시작" }));
    await user.click(screen.getByRole("button", { name: "일시정지" }));

    expect(services.startRhythm.execute).toHaveBeenCalledOnce();
    expect(services.pauseRhythm.execute).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "재개" })).not.toBeInTheDocument();
  });

  it("uses the play control to resume when the rhythm is paused", async () => {
    const user = userEvent.setup();
    const services = createServices();
    services.getStatus = { execute: vi.fn(() => pausedStatus()) };

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(screen.getByRole("button", { name: "시작" }));

    expect(services.resumeRhythm.execute).toHaveBeenCalledOnce();
    expect(services.startRhythm.execute).not.toHaveBeenCalled();
  });

  it("toggles notification sound preview and app-only volume controls", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    expect(screen.getByRole("button", { name: "기본" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "기본 학교종" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "미리듣기" }));
    await user.click(screen.getByRole("button", { name: "미리듣기 끝내기" }));
    await user.click(screen.getByRole("button", { name: "알림음 볼륨" }));
    fireEvent.change(screen.getByRole("slider", { name: "알림음 볼륨" }), { target: { value: "40" } });

    expect(services.previewNotificationSound.execute).toHaveBeenCalledOnce();
    expect(services.stopNotificationSoundPreview.execute).toHaveBeenCalledOnce();
    expect(services.updateNotificationSoundVolume.execute).toHaveBeenCalledWith(0.4);
  });

  it("toggles mute back to an audible notification sound", async () => {
    const user = userEvent.setup();
    const services = createServices();
    const muted = Preferences.default().toggleNotificationSoundMute();
    services.getStatus = { execute: vi.fn(() => ({ ...idleStatus(), notificationSound: muted.notificationSound })) };
    services.muteNotificationSound = { execute: vi.fn(() => Promise.resolve(Preferences.default())) };

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(screen.getByRole("button", { name: "소리 켜기" }));

    expect(services.muteNotificationSound.execute).toHaveBeenCalledOnce();
    expect(await screen.findByRole("button", { name: "무음" })).toBeInTheDocument();
  });

  it("adds a simple today todo below the clock", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.type(screen.getByLabelText("오늘 할 일 입력"), "보고서 정리");
    expect(screen.getByRole("button", { name: "시간 추가" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(services.addTodo.execute).toHaveBeenCalledWith({
      date: "2026-06-02",
      time: null,
      title: "보고서 정리",
    });
    expect(await screen.findByText("보고서 정리")).toBeInTheDocument();
  });

  it("moves the today todo view to the next date after midnight", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-06-02T23:59:59"));
      const services = createServices();

      render(<RhythmApp initialNow={new Date("2026-06-02T23:59:59")} services={services} />);

      expect(screen.getByText("2026-06-02")).toBeInTheDocument();

      vi.setSystemTime(new Date("2026-06-03T00:00:00"));
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(screen.getByText("2026-06-03")).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText("오늘 할 일 입력"), { target: { value: "새 날짜 할 일" } });
      fireEvent.click(screen.getByRole("button", { name: "추가" }));

      expect(services.addTodo.execute).toHaveBeenCalledWith({
        date: "2026-06-03",
        time: null,
        title: "새 날짜 할 일",
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps a manually selected calendar date when the app crosses midnight", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-06-02T23:59:59"));
      const services = createServices();

      render(<RhythmApp initialNow={new Date("2026-06-02T23:59:59")} services={services} />);
      fireEvent.click(screen.getByRole("button", { name: "캘린더" }));
      fireEvent.click(screen.getByRole("button", { name: "2026-06-05 할 일 없음" }));

      expect(screen.getByRole("heading", { name: "2026-06-05" })).toBeInTheDocument();

      vi.setSystemTime(new Date("2026-06-03T00:00:00"));
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(screen.getByRole("heading", { name: "2026-06-05" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "2026-06-03 할 일 없음" })).toHaveClass("today");
    } finally {
      vi.useRealTimers();
    }
  });

  it("normalizes typed todo time through the time picker when adding and editing todos", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.type(screen.getByLabelText("오늘 할 일 입력"), "보고서 정리");
    await user.click(screen.getByRole("button", { name: "시간 추가" }));

    await user.click(screen.getByRole("button", { name: "Todo 시간 수정" }));
    expect(await screen.findByRole("dialog", { name: "Todo 시간 수정" })).toHaveClass("time-picker-modal");
    expect(document.querySelector(".time-picker-popover")).not.toBeInTheDocument();

    const addTime = await screen.findByLabelText("Todo 시간 수정 직접 입력") as HTMLInputElement;
    expect(document.querySelector(".time-picker-direct-display")).toHaveTextContent("-- : --");
    await user.type(addTime, "1");
    expect(document.querySelector(".time-picker-direct-display")).toHaveTextContent("1- : --");
    await user.type(addTime, "4");
    expect(document.querySelector(".time-picker-direct-display")).toHaveTextContent("14 : --");
    await user.type(addTime, ":3");
    expect(addTime).toHaveValue("143");
    expect(document.querySelector(".time-picker-direct-display")).toHaveTextContent("14 : 3-");
    await user.type(addTime, "0");
    expect(addTime).toHaveValue("1430");
    expect(document.querySelector(".time-picker-direct-display")).toHaveTextContent("14 : 30");
    expect(document.querySelector(".time-picker-direct-separator")).toHaveTextContent(":");
    expect(screen.getByRole("button", { name: "Todo 시간 수정" })).toHaveTextContent("14:30");
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(services.addTodo.execute).toHaveBeenCalledWith({
      date: "2026-06-02",
      time: "14:30",
      title: "보고서 정리",
    });

    await user.click(await screen.findByRole("button", { name: "수정" }));
    await user.click(screen.getByRole("button", { name: "Todo 시간 수정" }));
    await user.click(screen.getByRole("button", { name: "09시" }));
    await user.click(screen.getByRole("button", { name: "05분" }));
    fireEvent.keyDown(screen.getByLabelText("Todo 제목 수정"), { key: "Enter" });

    expect(services.updateTodo.execute).toHaveBeenCalledWith({
      date: "2026-06-02",
      id: "todo-1",
      time: "09:05",
      title: "보고서 정리",
    });
  });

  it("saves or cancels todo edits with explicit buttons while keeping Escape cancel", async () => {
    const user = userEvent.setup();
    const services = createServices([todoSnapshot({ id: "todo-1", title: "보고서 정리" })]);

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(await screen.findByRole("button", { name: "수정" }));

    const editTitle = screen.getByLabelText("Todo 제목 수정");
    expect(screen.getByRole("button", { name: "저장" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();

    await user.clear(editTitle);
    await user.type(editTitle, "취소될 제목");
    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(services.updateTodo.execute).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Todo 제목 수정")).not.toBeInTheDocument();
    expect(await screen.findByText("보고서 정리")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "수정" }));
    await user.clear(screen.getByLabelText("Todo 제목 수정"));
    await user.type(screen.getByLabelText("Todo 제목 수정"), "저장될 제목");
    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(services.updateTodo.execute).toHaveBeenCalledWith({
      date: "2026-06-02",
      id: "todo-1",
      time: null,
      title: "저장될 제목",
    });

    await user.click(await screen.findByRole("button", { name: "수정" }));
    await user.clear(screen.getByLabelText("Todo 제목 수정"));
    await user.type(screen.getByLabelText("Todo 제목 수정"), "취소될 제목");
    fireEvent.keyDown(screen.getByLabelText("Todo 제목 수정"), { key: "Escape" });

    expect(services.updateTodo.execute).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText("Todo 제목 수정")).not.toBeInTheDocument();
  });

  it("shows todo time only when a time exists", async () => {
    const services = createServices([
      todoSnapshot({ displayOrder: 0, id: "todo-1", time: null, title: "보고서 정리" }),
      todoSnapshot({ displayOrder: 1, id: "todo-2", time: "08:15", title: "회의" }),
    ]);

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    expect(await screen.findByText("보고서 정리")).toBeInTheDocument();
    expect(screen.getByText("회의")).toBeInTheDocument();
    expect(screen.getByText("08:15")).toBeInTheDocument();
    expect(screen.queryByText("--:--")).not.toBeInTheDocument();
    expect(screen.queryByText("시간 없음")).not.toBeInTheDocument();
  });

  it("moves checked todos below incomplete todos", async () => {
    const user = userEvent.setup();
    const services = createServices([
      todoSnapshot({ displayOrder: 0, id: "todo-1", title: "A" }),
      todoSnapshot({ displayOrder: 1, id: "todo-2", title: "B" }),
    ]);

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(await screen.findByRole("checkbox", { name: "A 완료" }));

    const titlesAfterToggle = screen.getAllByText(/^[AB]$/).map((element: HTMLElement): string => element.textContent ?? "");
    expect(titlesAfterToggle).toEqual(["B", "A"]);
  });

  it("reorders todos with drag handles without rendering move buttons", async () => {
    const services = createServices([
      todoSnapshot({ displayOrder: 0, id: "todo-1", title: "A" }),
      todoSnapshot({ displayOrder: 1, id: "todo-2", title: "B" }),
      todoSnapshot({ displayOrder: 2, id: "todo-3", title: "C" }),
    ]);

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await screen.findByText("B");
    expect(screen.queryByRole("button", { name: "B 위로 이동" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "B 아래로 이동" })).not.toBeInTheDocument();

    const dataTransfer = createDragDataTransfer();
    fireEvent.dragStart(screen.getByRole("button", { name: "B 순서 끌기" }), { dataTransfer });
    fireEvent.dragOver(screen.getByText("A").closest("li") as HTMLElement, { dataTransfer });
    fireEvent.drop(screen.getByText("A").closest("li") as HTMLElement, { dataTransfer });

    expect(services.reorderTodos.execute).toHaveBeenCalledWith({
      date: "2026-06-02",
      orderedIds: ["todo-2", "todo-1", "todo-3"],
    });
  });

  it("moves a dragged todo after the target when dragging from top to bottom", async () => {
    const services = createServices([
      todoSnapshot({ displayOrder: 0, id: "todo-1", title: "A" }),
      todoSnapshot({ displayOrder: 1, id: "todo-2", title: "B" }),
      todoSnapshot({ displayOrder: 2, id: "todo-3", title: "C" }),
    ]);

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await screen.findByText("A");

    const dataTransfer = createDragDataTransfer();
    fireEvent.dragStart(screen.getByRole("button", { name: "A 순서 끌기" }), { dataTransfer });
    fireEvent.dragOver(screen.getByText("C").closest("li") as HTMLElement, { dataTransfer });
    fireEvent.drop(screen.getByText("C").closest("li") as HTMLElement, { dataTransfer });

    expect(services.reorderTodos.execute).toHaveBeenCalledWith({
      date: "2026-06-02",
      orderedIds: ["todo-2", "todo-3", "todo-1"],
    });
  });

  it("ignores drag drops across completed and incomplete todo groups", async () => {
    const services = createServices([
      todoSnapshot({ completed: false, displayOrder: 0, id: "todo-1", title: "A" }),
      todoSnapshot({ completed: true, displayOrder: 1, id: "todo-2", title: "B" }),
      todoSnapshot({ completed: false, displayOrder: 2, id: "todo-3", title: "C" }),
    ]);

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await screen.findByText("B");

    const dataTransfer = createDragDataTransfer();
    fireEvent.dragStart(screen.getByRole("button", { name: "B 순서 끌기" }), { dataTransfer });
    fireEvent.dragOver(screen.getByText("A").closest("li") as HTMLElement, { dataTransfer });
    fireEvent.drop(screen.getByText("A").closest("li") as HTMLElement, { dataTransfer });

    expect(services.reorderTodos.execute).not.toHaveBeenCalled();
  });

  it("uses the same quiet no-time display on the calendar todo panel", async () => {
    const user = userEvent.setup();
    const services = createServices([todoSnapshot({ id: "todo-1", time: null, title: "캘린더 할 일" })]);

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(screen.getByRole("button", { name: "캘린더" }));

    expect(await screen.findByText("캘린더 할 일")).toBeInTheDocument();
    expect(screen.queryByText("--:--")).not.toBeInTheDocument();
    expect(screen.queryByText("시간 없음")).not.toBeInTheDocument();
  });

  it("renders the calendar as an app-styled month grid instead of a native month input", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(screen.getByRole("button", { name: "캘린더" }));

    expect(screen.queryByLabelText("캘린더 월")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2026년 06월" })).toBeInTheDocument();
    expect(screen.getByText("일")).toBeInTheDocument();
    expect(screen.getAllByText("월").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "다음 달" }));

    expect(await screen.findByRole("heading", { name: "2026년 07월" })).toBeInTheDocument();
  });

  it("explains Google Tasks setup controls with focused help text", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(screen.getByRole("button", { name: "캘린더" }));

    expect(screen.getByRole("heading", { name: "Google Tasks 연동" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Client ID 도움말" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "인증 도움말" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tasks 목록 도움말" })).toBeInTheDocument();
    expect(screen.getByText("Google Cloud Console에서 만든 Desktop OAuth Client ID를 저장합니다.")).toBeInTheDocument();
    expect(screen.getByText("브라우저 인증 후 redirect URL 전체를 붙여넣는 것을 권장합니다. code 값만 붙여넣어도 동작합니다.")).toBeInTheDocument();
    expect(screen.getByText("연동할 Google Tasks 목록을 고르고 로컬 Todo와 수동 동기화합니다.")).toBeInTheDocument();
  });

  it("shows a localized Google failure message without clearing local todos", async () => {
    const user = userEvent.setup();
    const services = createServices([todoSnapshot({ id: "todo-1", title: "로컬 할 일" })]);
    services.syncGoogleTodos = { execute: vi.fn(() => Promise.reject(new Error("Google Tasks 목록을 먼저 선택해주세요."))) };

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);
    await user.click(screen.getByRole("button", { name: "캘린더" }));
    await user.click(screen.getByRole("button", { name: "수동 동기화" }));

    expect(await screen.findByText("Google 작업 실패: Google Tasks 목록을 먼저 선택해주세요.")).toBeInTheDocument();
    expect(screen.getByText("로컬 할 일")).toBeInTheDocument();
  });

  it("shows a localized authorization failure message without clearing local todos", async () => {
    const user = userEvent.setup();
    const services = createServices([todoSnapshot({ id: "todo-1", title: "로컬 할 일" })]);
    services.completeGoogleAuthorization = {
      execute: vi.fn(() => Promise.reject(new Error("Google 인증 토큰을 발급받지 못했습니다. (HTTP 400: invalid_grant)"))),
    };

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);
    await user.click(screen.getByRole("button", { name: "캘린더" }));
    await user.type(screen.getByLabelText("Google 인증 코드"), "raw-code");
    await user.click(screen.getByRole("button", { name: "인증 저장" }));

    expect(await screen.findByText("Google 작업 실패: Google 인증 토큰을 발급받지 못했습니다. (HTTP 400: invalid_grant)")).toBeInTheDocument();
    expect(screen.getByText("로컬 할 일")).toBeInTheDocument();
  });
});

function todoSnapshot(overrides: Partial<TodoItemSnapshot>): TodoItemSnapshot {
  return {
    completed: false,
    createdAt: "2026-06-02T05:10:00.000Z",
    date: "2026-06-02",
    displayOrder: 0,
    googleTaskId: null,
    id: "todo-1",
    time: null,
    title: "Todo",
    updatedAt: "2026-06-02T05:10:00.000Z",
    ...overrides,
  };
}

function createDragDataTransfer(): DataTransfer {
  const values = new Map<string, string>();

  return {
    clearData: vi.fn(),
    dropEffect: "move",
    effectAllowed: "move",
    files: [] as unknown as FileList,
    getData: vi.fn((format: string): string => values.get(format) ?? ""),
    items: [] as unknown as DataTransferItemList,
    setData: vi.fn((format: string, value: string): void => {
      values.set(format, value);
    }),
    setDragImage: vi.fn(),
    types: [],
  };
}
