import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RhythmStatusSnapshot } from "../contexts/rhythm/public";
import type { PreparedBackupImport } from "../features/data-transfer/public";
import { UserPreferences as Preferences } from "../contexts/preferences/public";
import type { TodoDaySummary, TodoItemSnapshot } from "../contexts/todo/public";
import { ClockRhythmApp as GroupedRhythmApp } from "./ClockRhythmApp";
import type { AppModules } from "./contracts/AppModules";

type TestRhythmAppServices = ReturnType<typeof createServices>;

interface LegacyRhythmAppProps {
  services: TestRhythmAppServices;
  initialNow?: Date;
}

function RhythmApp({ services, initialNow }: LegacyRhythmAppProps): React.JSX.Element {
  return <GroupedRhythmApp initialNow={initialNow} initialPreferences={services.initialPreferences} modules={createTestAppModules(services)} />;
}

function runningStatus(): RhythmStatusSnapshot {
  return {
    sessionStatus: "running",
    focusMinutes: 50,
    restMinutes: 10,
    dailyStart: "05:00",
    dailyEnd: "18:00",
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

function createServices(initialTodos: Array<TodoItemSnapshot> = []) {
  const todos: Array<TodoItemSnapshot> = [...initialTodos];

  return {
    initialPreferences: Preferences.default().completeInitialSetup().snapshot(),
    startRhythm: { execute: vi.fn(() => Promise.resolve(runningStatus())) },
    pauseRhythm: { execute: vi.fn(() => Promise.resolve(pausedStatus())) },
    resumeRhythm: { execute: vi.fn(() => Promise.resolve(runningStatus())) },
    stopForToday: { execute: vi.fn(() => Promise.resolve(stoppedForTodayStatus())) },
    getStatus: { execute: vi.fn(() => idleStatus()) },
    getPreferences: { execute: vi.fn(() => Promise.resolve(Preferences.default().snapshot())) },
    updatePreferences: { execute: vi.fn(() => Promise.resolve(Preferences.default())) },
    chooseCustomNotificationSound: { execute: vi.fn(() => Promise.resolve(Preferences.default())) },
    muteNotificationSound: { execute: vi.fn(() => Promise.resolve(Preferences.default().toggleNotificationSoundMute())) },
    previewNotificationSound: { execute: vi.fn(() => Promise.resolve()) },
    stopNotificationSoundPreview: { execute: vi.fn(() => Promise.resolve()) },
    updateNotificationSoundVolume: { execute: vi.fn(() => Promise.resolve(Preferences.default().changeNotificationSoundVolume(0.4))) },
    useDefaultNotificationSound: { execute: vi.fn(() => Promise.resolve(Preferences.default())) },
    changeLanguage: { execute: vi.fn((language: "kor" | "en") => Promise.resolve(Preferences.default().changeLanguage(language))) },
    changeTheme: { execute: vi.fn((theme: Preferences["theme"]) => Promise.resolve(Preferences.default().changeTheme(theme))) },
    addTodo: {
      execute: vi.fn((command: { title: string; date: string; time?: string | null }) => {
        const todo: TodoItemSnapshot = {
          completed: false,
          createdAt: "2026-06-02T05:10:00.000Z",
          date: command.date,
          displayOrder: nextDisplayOrder(todos, command.date),
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
    exportBackup: { execute: vi.fn(() => Promise.resolve()) },
    previewImportBackup: { execute: vi.fn(() => Promise.resolve(defaultPreparedBackupImport())) },
    importBackup: { execute: vi.fn(() => Promise.resolve()) },
  };
}

function createTestAppModules(services: TestRhythmAppServices): AppModules {
  return {
    rhythm: {
      getStatus: services.getStatus,
      pause: services.pauseRhythm,
      resume: services.resumeRhythm,
      start: services.startRhythm,
      stopForToday: services.stopForToday,
    },
    preferences: {
      get: services.getPreferences,
      changeLanguage: services.changeLanguage,
      changeTheme: services.changeTheme,
      chooseCustomNotificationSound: services.chooseCustomNotificationSound,
      muteNotificationSound: services.muteNotificationSound,
      previewNotificationSound: services.previewNotificationSound,
      stopNotificationSoundPreview: services.stopNotificationSoundPreview,
      update: services.updatePreferences,
      updateNotificationSoundVolume: services.updateNotificationSoundVolume,
      useDefaultNotificationSound: services.useDefaultNotificationSound,
    },
    todo: {
      add: services.addTodo,
      delete: services.deleteTodo,
      getByDate: services.getTodosByDate,
      getCalendarSummary: services.getTodoCalendarSummary,
      reorder: services.reorderTodos,
      toggle: services.toggleTodo,
      update: services.updateTodo,
    },
    dataTransfer: {
      exportBackup: services.exportBackup,
      importBackup: services.importBackup,
      previewImport: services.previewImportBackup,
    },
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

function defaultPreparedBackupImport(): PreparedBackupImport {
  return {
    backupText: "{}",
    summary: {
      exportedAt: "2026-06-02T10:00:00.000Z",
      focusMinutes: 50,
      language: "kor",
      restMinutes: 10,
      todoCount: 0,
    },
  };
}

async function openRhythmSettings(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: /집중 시간대\/알림 설정|Focus window\/sound settings/ }));
}

describe("RhythmApp", () => {
  it("observes the app shell size when choosing layout mode", async () => {
    const originalResizeObserver = globalThis.ResizeObserver;
    let observedElement: Element | null = null;

    class FakeResizeObserver {
      public observe(element: Element): void {
        observedElement = element;
      }

      public unobserve(): void {}

      public disconnect(): void {}
    }

    globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;

    try {
      render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={createServices()} />);

      await waitFor((): void => {
        expect(observedElement).toHaveClass("app-shell");
      });
    } finally {
      globalThis.ResizeObserver = originalResizeObserver;
    }
  });

  it("renders the live clock, controls, todo list, and collapsed rhythm settings summary", () => {
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    expect(screen.getByText("05 : 10 : 00")).toBeInTheDocument();
    expect(screen.getByText("다음 알림: 05:50")).toBeInTheDocument();
    expect(screen.getByText("대기")).toBeInTheDocument();
    expect(screen.queryByText("idle")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "시작" })).toBeInTheDocument();
    expect(screen.getByText("오늘 할 일")).toBeInTheDocument();
    expect(screen.getByText("50분 집중 · 10분 휴식 · 05:00-18:00 · 기본")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /집중 시간대\/알림 설정/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("집중 시간")).not.toBeInTheDocument();
  });

  it("expands the rhythm and sound settings when the summary is toggled", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await openRhythmSettings(user);

    expect(screen.getByRole("button", { name: /집중 시간대\/알림 설정/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("집중 시간")).toHaveValue("50");
    expect(screen.getByLabelText("휴식 시간")).toHaveValue("10");
    expect(screen.getByText("분 · 1-180")).toBeInTheDocument();
    expect(screen.getByText("분 · 1-60")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "집중 시간대 시작" })).toHaveTextContent("05:00");
    expect(screen.getByRole("button", { name: "집중 시간대 종료" })).toHaveTextContent("18:00");
    expect(screen.getByRole("button", { name: "기본" })).toBeInTheDocument();
  });

  it("opens rhythm settings on the first launch until setup is saved once", () => {
    const services = createServices();
    services.initialPreferences = Preferences.default().snapshot();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    expect(screen.getByRole("button", { name: /집중 시간대\/알림 설정/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("집중 시간")).toHaveValue("50");
  });

  it("keeps minute inputs as drafts until a valid value is committed", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await openRhythmSettings(user);

    const focusInput = screen.getByLabelText("집중 시간");
    await user.clear(focusInput);

    expect(focusInput).toHaveValue("");
    expect(screen.getByText("분 · 1-180")).toBeInTheDocument();
    expect(screen.queryByText("1-180분")).not.toBeInTheDocument();

    await user.type(focusInput, "181");
    fireEvent.blur(focusInput);

    expect(focusInput).toHaveValue("50");
    expect(services.updatePreferences.execute).not.toHaveBeenCalled();
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

  it("renders theme selection as the fourth top-level tab and applies the selected theme to the app shell", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    expect(screen.getByRole("button", { name: "테마" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "테마" }));

    expect(screen.getByRole("heading", { name: "테마" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /테마 선택$/ })).toHaveLength(11);

    await user.click(screen.getByRole("button", { name: "Tokyo Night 테마 선택" }));

    expect(services.changeTheme.execute).toHaveBeenCalledWith("tokyo-night");
    expect(document.querySelector(".app-shell")).toHaveAttribute("data-theme", "tokyo-night");
  });

  it("uses locale-independent time pickers for rhythm start and end", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(screen.getByRole("button", { name: "English" }));
    await openRhythmSettings(user);

    const dayStart = await screen.findByRole("button", { name: "Focus window start" });
    const dayEnd = await screen.findByRole("button", { name: "Focus window end" });

    expect(dayStart).toHaveTextContent("05:00");
    expect(dayEnd).toHaveTextContent("18:00");

    await user.click(dayStart);

    const directInput = screen.getByLabelText("Focus window start direct input") as HTMLInputElement;
    await waitFor((): void => {
      expect(directInput).toHaveFocus();
    });
    expect(directInput).toHaveValue("0500");
    expect(directInput.selectionStart).toBe(0);
    expect(directInput.selectionEnd).toBe(4);
    expect(screen.queryByDisplayValue(/오전|오후/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it("focuses the visible time slots immediately and marks direct input as editing", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await openRhythmSettings(user);
    await user.click(screen.getByRole("button", { name: "집중 시간대 시작" }));

    const directInput = await screen.findByLabelText("집중 시간대 시작 직접 입력") as HTMLInputElement;
    await waitFor((): void => {
      expect(directInput).toHaveFocus();
    });

    expect(screen.getByText("입력 중")).toBeInTheDocument();
    expect(document.querySelector(".time-picker-direct-entry")).toHaveClass("editing");

    await user.keyboard("2300");

    expect(directInput).toHaveValue("2300");
    expect(document.querySelector(".time-picker-direct-display")).toHaveTextContent("23 : 00");

    directInput.blur();
    fireEvent.pointerDown(document.querySelector(".time-picker-direct-entry") as HTMLElement);

    expect(directInput).toHaveFocus();
  });

  it("keeps todo time optional while rhythm times are required", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(screen.getByRole("button", { name: "시간 추가" }));
    await user.click(screen.getByRole("button", { name: "Todo 시간 수정" }));

    expect(await screen.findByRole("button", { name: "비우기" })).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Todo 시간 수정 직접 입력"));
    await user.type(screen.getByLabelText("Todo 시간 수정 직접 입력"), "2360");

    expect(screen.getByText("시간은 00:00-23:59로 입력해주세요.")).toBeInTheDocument();
  });

  it("shows localized success messages for every rhythm command", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(screen.getByRole("button", { name: "시작" }));
    expect(await screen.findByRole("status")).toHaveTextContent("집중 시간대가 실행 중입니다.");

    await user.click(screen.getByRole("button", { name: "일시정지" }));
    expect(await screen.findByRole("status")).toHaveTextContent("집중 시간대를 일시정지했습니다.");

    await user.click(screen.getByRole("button", { name: "시작" }));
    expect(await screen.findByRole("status")).toHaveTextContent("집중 시간대가 실행 중입니다.");

    await user.click(screen.getByRole("button", { name: "오늘 종료" }));
    expect(await screen.findByRole("status")).toHaveTextContent("오늘의 집중 시간대를 종료했습니다.");

    expect(services.startRhythm.execute).toHaveBeenCalledOnce();
    expect(services.pauseRhythm.execute).toHaveBeenCalledOnce();
    expect(services.resumeRhythm.execute).toHaveBeenCalledOnce();
    expect(services.stopForToday.execute).toHaveBeenCalledOnce();
  });

  it("shows rhythm command failures near the clock controls", async () => {
    const user = userEvent.setup();
    const services = createServices();
    services.startRhythm = { execute: vi.fn(() => Promise.reject(new Error("start unavailable"))) };

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(screen.getByRole("button", { name: "시작" }));

    expect(await screen.findByRole("status")).toHaveTextContent("start unavailable");
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

    await openRhythmSettings(user);

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

  it("warns when audible notification volume is zero", () => {
    const services = createServices();
    services.initialPreferences = Preferences.default()
      .completeInitialSetup()
      .changeNotificationSoundVolume(0)
      .snapshot();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    expect(screen.getByText("볼륨 0%")).toBeInTheDocument();
  });

  it("shows sound action failures instead of losing them as unhandled promises", async () => {
    const user = userEvent.setup();
    const services = createServices();
    services.previewNotificationSound = { execute: vi.fn(() => Promise.reject(new Error("play blocked"))) };

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await openRhythmSettings(user);
    await user.click(screen.getByRole("button", { name: "미리듣기" }));

    expect(await screen.findByText("알림음 작업 실패: play blocked")).toBeInTheDocument();
  });

  it("toggles mute back to an audible notification sound", async () => {
    const user = userEvent.setup();
    const services = createServices();
    const muted = Preferences.default().toggleNotificationSoundMute();
    services.initialPreferences = muted.completeInitialSetup().snapshot();
    services.muteNotificationSound = { execute: vi.fn(() => Promise.resolve(Preferences.default())) };

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await openRhythmSettings(user);
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

  it("shows todo command failures in the owning todo panel", async () => {
    const user = userEvent.setup();
    const services = createServices();
    services.addTodo = { execute: vi.fn(() => Promise.reject(new Error("save unavailable"))) };

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.type(screen.getByLabelText("오늘 할 일 입력"), "보고서 정리");
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Todo 작업 실패: save unavailable");
  });

  it("prevents empty today todo titles before calling the add use case", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    const titleInput = screen.getByLabelText("오늘 할 일 입력");
    const addButton = screen.getByRole("button", { name: "추가" });

    expect(addButton).toBeDisabled();
    expect(titleInput).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByText("할 일을 입력해주세요.")).not.toBeInTheDocument();

    await user.type(titleInput, "   ");

    expect(addButton).toBeDisabled();
    expect(titleInput).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("할 일을 입력해주세요.")).toBeInTheDocument();
    expect(titleInput.closest(".todo-title-field")?.querySelector(".field-feedback")).toContainElement(screen.getByText("할 일을 입력해주세요."));
    expect(services.addTodo.execute).not.toHaveBeenCalled();
  });

  it("shows the today todo title error only after a previously edited title is cleared", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    const titleInput = screen.getByLabelText("오늘 할 일 입력");

    expect(screen.queryByText("할 일을 입력해주세요.")).not.toBeInTheDocument();

    await user.type(titleInput, "보고서");
    await user.clear(titleInput);

    expect(titleInput).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("할 일을 입력해주세요.")).toBeInTheDocument();
  });

  it("shows a todo title counter near the title length limit", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.type(screen.getByLabelText("오늘 할 일 입력"), "가".repeat(120));

    expect(screen.getByText("120/160")).toBeInTheDocument();
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
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      vi.setSystemTime(new Date("2026-06-02T05:10:00"));
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
      await waitFor((): void => {
        expect(addTime).toHaveFocus();
      });
      await user.keyboard("1");
      expect(document.querySelector(".time-picker-direct-display")).toHaveTextContent("1- : --");
      await user.keyboard("4");
      expect(document.querySelector(".time-picker-direct-display")).toHaveTextContent("14 : --");
      await user.keyboard(":3");
      expect(addTime).toHaveValue("143");
      expect(document.querySelector(".time-picker-direct-display")).toHaveTextContent("14 : 3-");
      await user.keyboard("0");
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
    } finally {
      vi.useRealTimers();
    }
  });

  it("saves or cancels todo edits with explicit buttons while keeping Escape cancel", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      vi.setSystemTime(new Date("2026-06-02T05:10:00"));
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
    } finally {
      vi.useRealTimers();
    }
  });

  it("prevents invalid todo edits before calling the update use case", async () => {
    const user = userEvent.setup();
    const services = createServices([todoSnapshot({ id: "todo-1", title: "보고서 정리" })]);

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(await screen.findByRole("button", { name: "수정" }));
    await user.clear(screen.getByLabelText("Todo 제목 수정"));

    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
    expect(screen.getByLabelText("Todo 제목 수정")).toHaveAttribute("aria-invalid", "true");

    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(services.updateTodo.execute).not.toHaveBeenCalled();
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

  it("shows data management as a top-level data tab instead of a calendar footer", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    expect(screen.getByRole("button", { name: "데이터" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "캘린더" }));

    expect(screen.queryByRole("heading", { name: "데이터 관리" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "데이터" }));

    expect(screen.getByRole("heading", { name: "데이터 관리" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "내보내기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "가져오기" })).toBeInTheDocument();
  });

  it("replaces Google Tasks setup with data management controls", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(screen.getByRole("button", { name: "데이터" }));

    expect(screen.getByRole("heading", { name: "데이터 관리" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "내보내기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "가져오기" })).toBeInTheDocument();
    expect(screen.queryByText("Google Tasks 연동")).not.toBeInTheDocument();
    expect(screen.queryByText("Client ID")).not.toBeInTheDocument();
    expect(screen.queryByText("OAuth")).not.toBeInTheDocument();
    expect(screen.queryByText("수동 동기화")).not.toBeInTheDocument();
  });

  it("exports and imports backups through an explicit replacement confirmation", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(screen.getByRole("button", { name: "데이터" }));
    await user.click(screen.getByRole("button", { name: "내보내기" }));

    expect(services.exportBackup.execute).toHaveBeenCalledOnce();
    expect(await screen.findByText("백업 파일을 내보냈습니다.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "가져오기" }));
    expect(screen.getByRole("dialog", { name: "백업 가져오기" })).toBeInTheDocument();
    expect(screen.getByText("Todo 0개")).toBeInTheDocument();
    expect(screen.getByText("집중 50분 / 휴식 10분")).toBeInTheDocument();
    expect(screen.getByText("현재 설정과 Todo가 백업 파일 내용으로 전체 교체됩니다.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "전체 교체" }));

    expect(services.importBackup.execute).toHaveBeenCalledOnce();
    expect(await screen.findByText("백업 파일로 전체 복원했습니다.")).toBeInTheDocument();
  });

  it("does not import a backup when the replacement confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(screen.getByRole("button", { name: "데이터" }));
    await user.click(screen.getByRole("button", { name: "가져오기" }));
    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(services.importBackup.execute).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "백업 가져오기" })).not.toBeInTheDocument();
  });

  it("reloads todo views after a backup import succeeds", async () => {
    const user = userEvent.setup();
    const services = createServices();

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(screen.getByRole("button", { name: "데이터" }));
    const todosLoadedBeforeImport = vi.mocked(services.getTodosByDate.execute).mock.calls.length;
    const summariesLoadedBeforeImport = vi.mocked(services.getTodoCalendarSummary.execute).mock.calls.length;

    await user.click(screen.getByRole("button", { name: "가져오기" }));
    await user.click(screen.getByRole("button", { name: "전체 교체" }));

    await waitFor((): void => {
      expect(vi.mocked(services.getTodosByDate.execute).mock.calls.length).toBeGreaterThan(todosLoadedBeforeImport);
      expect(vi.mocked(services.getTodoCalendarSummary.execute).mock.calls.length).toBeGreaterThan(summariesLoadedBeforeImport);
    });
  });

  it("shows localized backup failure messages without leaving the import dialog open", async () => {
    const user = userEvent.setup();
    const services = createServices();
    services.exportBackup = { execute: vi.fn(() => Promise.reject(new Error("export failed"))) };
    services.importBackup = { execute: vi.fn(() => Promise.reject(new Error("import failed"))) };

    render(<RhythmApp initialNow={new Date("2026-06-02T05:10:00")} services={services} />);

    await user.click(screen.getByRole("button", { name: "데이터" }));
    await user.click(screen.getByRole("button", { name: "내보내기" }));

    expect(await screen.findByText("백업 작업 실패: export failed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "가져오기" }));
    await user.click(screen.getByRole("button", { name: "전체 교체" }));

    expect(await screen.findByText("백업 작업 실패: import failed")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "백업 가져오기" })).toBeInTheDocument();
  });
});

function todoSnapshot(overrides: Partial<TodoItemSnapshot>): TodoItemSnapshot {
  return {
    completed: false,
    createdAt: "2026-06-02T05:10:00.000Z",
    date: "2026-06-02",
    displayOrder: 0,
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
