import { useEffect, useReducer } from "react";
import type { TodoDaySummary } from "../contexts/todo/domain/TodoList";
import type { TodoItemSnapshot } from "../contexts/todo/domain/TodoItem";
import type { RhythmAppServices } from "./RhythmAppServices";
import { addMonthsToMonthKey, currentMonthKey, formatDateKey } from "./dateFormat";
import { formatText, type TextCatalog } from "./textCatalog";
import { normalizeOptionalTimeText } from "./timeText";

export type AppPage = "clock" | "calendar";

interface TodoFormState {
  title: string;
  timeEnabled: boolean;
  time: string;
}

interface TodoEditState {
  id: string;
  title: string;
  date: string;
  time: string;
}

interface TodoAppState {
  page: AppPage;
  todayDate: string;
  selectedDate: string;
  calendarMonth: string;
  todayTodos: Array<TodoItemSnapshot>;
  selectedDateTodos: Array<TodoItemSnapshot>;
  calendarSummary: Record<string, TodoDaySummary>;
  form: TodoFormState;
  edit: TodoEditState | null;
  importConfirmationOpen: boolean;
  message: string;
}

type TodoAppAction =
  | { type: "PAGE_CHANGED"; page: AppPage }
  | { type: "TODAY_CHANGED"; todayDate: string }
  | { type: "TODAY_TODOS_LOADED"; todos: Array<TodoItemSnapshot> }
  | { type: "SELECTED_DATE_TODOS_LOADED"; todos: Array<TodoItemSnapshot> }
  | { type: "CALENDAR_SUMMARY_LOADED"; summary: Record<string, TodoDaySummary> }
  | { type: "TODO_FORM_CHANGED"; field: keyof TodoFormState; value: string | boolean }
  | { type: "TODO_FORM_CLEARED" }
  | { type: "SELECTED_DATE_CHANGED"; date: string }
  | { type: "CALENDAR_MONTH_CHANGED"; month: string }
  | { type: "EDIT_STARTED"; todo: TodoItemSnapshot }
  | { type: "EDIT_CHANGED"; field: keyof TodoEditState; value: string | boolean }
  | { type: "EDIT_CLEARED" }
  | { type: "IMPORT_CONFIRMATION_CHANGED"; open: boolean }
  | { type: "MESSAGE_CHANGED"; message: string };

export interface TodoAppViewModel {
  page: AppPage;
  todayDate: string;
  selectedDate: string;
  calendarMonth: string;
  todayTodos: Array<TodoItemSnapshot>;
  selectedDateTodos: Array<TodoItemSnapshot>;
  calendarSummary: Record<string, TodoDaySummary>;
  form: TodoFormState;
  edit: TodoEditState | null;
  importConfirmationOpen: boolean;
  message: string;
  showClock(): Promise<void>;
  showCalendar(): Promise<void>;
  changeTitle(title: string): void;
  showTimeInput(): void;
  changeTime(time: string): void;
  addTodayTodo(): Promise<void>;
  toggleTodo(id: string): Promise<void>;
  deleteTodo(id: string): Promise<void>;
  startEditing(todo: TodoItemSnapshot): void;
  changeEditTitle(title: string): void;
  changeEditDate(date: string): void;
  changeEditTime(time: string): void;
  cancelEditing(): void;
  saveEdit(): Promise<void>;
  reorderTodos(date: string, orderedIds: Array<string>): Promise<void>;
  selectDate(date: string): Promise<void>;
  changeCalendarMonth(month: string): Promise<void>;
  moveCalendarMonth(offset: -1 | 1): Promise<void>;
  goToTodayMonth(): Promise<void>;
  exportBackup(): Promise<void>;
  requestImportBackup(): void;
  cancelImportBackup(): void;
  confirmImportBackup(): Promise<void>;
}

export function useTodoApp(services: RhythmAppServices, currentNow: Date, text: TextCatalog): TodoAppViewModel {
  const [state, dispatch] = useReducer(reducer, createInitialState(currentNow));
  const currentTodayDate = formatDateKey(currentNow);

  useEffect((): void => {
    void refreshToday(services, state.todayDate, dispatch);
    void refreshSelectedDate(services, state.selectedDate, dispatch);
    void refreshCalendarSummary(services, state.calendarMonth, dispatch);
  }, [services, state.todayDate, state.selectedDate, state.calendarMonth]);

  useEffect((): void => {
    if (state.todayDate !== currentTodayDate) {
      dispatch({ type: "TODAY_CHANGED", todayDate: currentTodayDate });
    }
  }, [currentTodayDate, state.todayDate]);

  const changeCalendarMonth = async (month: string): Promise<void> => {
    dispatch({ type: "CALENDAR_MONTH_CHANGED", month });
    await refreshCalendarSummary(services, month, dispatch);
  };

  return {
    ...state,
    addTodayTodo: async (): Promise<void> => {
      const time = normalizedTodoTime(state.form.timeEnabled ? state.form.time : "", text, dispatch);

      if (time.failed) {
        return;
      }

      await services.addTodo.execute({ date: state.todayDate, time: time.value, title: state.form.title });
      dispatch({ type: "TODO_FORM_CLEARED" });
      await refreshTodoViews(services, state, dispatch);
    },
    cancelEditing: (): void => dispatch({ type: "EDIT_CLEARED" }),
    changeCalendarMonth,
    changeEditDate: (date: string): void => dispatch({ type: "EDIT_CHANGED", field: "date", value: date }),
    changeEditTime: (time: string): void => dispatch({ type: "EDIT_CHANGED", field: "time", value: time }),
    changeEditTitle: (title: string): void => dispatch({ type: "EDIT_CHANGED", field: "title", value: title }),
    changeTime: (time: string): void => dispatch({ type: "TODO_FORM_CHANGED", field: "time", value: time }),
    changeTitle: (title: string): void => dispatch({ type: "TODO_FORM_CHANGED", field: "title", value: title }),
    cancelImportBackup: (): void => dispatch({ type: "IMPORT_CONFIRMATION_CHANGED", open: false }),
    confirmImportBackup: async (): Promise<void> => {
      await runTodoAction(async (): Promise<void> => {
        await services.importBackup.execute();
        dispatch({ type: "IMPORT_CONFIRMATION_CHANGED", open: false });
        dispatch({ type: "MESSAGE_CHANGED", message: text.messages.backupImported });
        await refreshTodoViews(services, state, dispatch);
      }, text, dispatch);
    },
    deleteTodo: async (id: string): Promise<void> => {
      await services.deleteTodo.execute(id);
      await refreshTodoViews(services, state, dispatch);
    },
    exportBackup: async (): Promise<void> => {
      await runTodoAction(async (): Promise<void> => {
        await services.exportBackup.execute();
        dispatch({ type: "MESSAGE_CHANGED", message: text.messages.backupExported });
      }, text, dispatch);
    },
    goToTodayMonth: async (): Promise<void> => {
      const todayMonth = state.todayDate.slice(0, 7);
      dispatch({ type: "SELECTED_DATE_CHANGED", date: state.todayDate });
      await refreshSelectedDate(services, state.todayDate, dispatch);
      await changeCalendarMonth(todayMonth);
    },
    moveCalendarMonth: async (offset: -1 | 1): Promise<void> => {
      await changeCalendarMonth(addMonthsToMonthKey(state.calendarMonth, offset));
    },
    reorderTodos: async (date: string, orderedIds: Array<string>): Promise<void> => {
      await services.reorderTodos.execute({ date, orderedIds });
      await refreshTodoViews(services, state, dispatch);
    },
    saveEdit: async (): Promise<void> => {
      if (!state.edit) {
        return;
      }

      const time = normalizedTodoTime(state.edit.time, text, dispatch);

      if (time.failed) {
        return;
      }

      await services.updateTodo.execute({
        date: state.edit.date,
        id: state.edit.id,
        time: time.value,
        title: state.edit.title,
      });
      dispatch({ type: "EDIT_CLEARED" });
      await refreshTodoViews(services, state, dispatch);
    },
    selectDate: async (date: string): Promise<void> => {
      dispatch({ type: "SELECTED_DATE_CHANGED", date });
      await refreshSelectedDate(services, date, dispatch);
    },
    requestImportBackup: (): void => dispatch({ type: "IMPORT_CONFIRMATION_CHANGED", open: true }),
    showCalendar: async (): Promise<void> => {
      dispatch({ type: "PAGE_CHANGED", page: "calendar" });
      await refreshCalendarSummary(services, state.calendarMonth, dispatch);
    },
    showClock: async (): Promise<void> => {
      dispatch({ type: "PAGE_CHANGED", page: "clock" });
      await refreshToday(services, state.todayDate, dispatch);
    },
    showTimeInput: (): void => dispatch({ type: "TODO_FORM_CHANGED", field: "timeEnabled", value: true }),
    startEditing: (todo: TodoItemSnapshot): void => dispatch({ type: "EDIT_STARTED", todo }),
    toggleTodo: async (id: string): Promise<void> => {
      await services.toggleTodo.execute(id);
      await refreshTodoViews(services, state, dispatch);
    },
  };
}

function createInitialState(initialNow: Date): TodoAppState {
  const todayDate = formatDateKey(initialNow);

  return {
    calendarMonth: currentMonthKey(initialNow),
    calendarSummary: {},
    edit: null,
    form: { time: "", timeEnabled: false, title: "" },
    importConfirmationOpen: false,
    message: "",
    page: "clock",
    selectedDate: todayDate,
    selectedDateTodos: [],
    todayDate,
    todayTodos: [],
  };
}

function reducer(state: TodoAppState, action: TodoAppAction): TodoAppState {
  if (action.type === "PAGE_CHANGED") {
    return { ...state, page: action.page };
  }

  if (action.type === "TODAY_CHANGED") {
    const followsToday = state.selectedDate === state.todayDate;
    const nextTodayMonth = action.todayDate.slice(0, 7);

    return {
      ...state,
      calendarMonth: followsToday && state.calendarMonth === state.todayDate.slice(0, 7) ? nextTodayMonth : state.calendarMonth,
      selectedDate: followsToday ? action.todayDate : state.selectedDate,
      todayDate: action.todayDate,
    };
  }

  if (action.type === "TODAY_TODOS_LOADED") {
    return { ...state, todayTodos: action.todos };
  }

  if (action.type === "SELECTED_DATE_TODOS_LOADED") {
    return { ...state, selectedDateTodos: action.todos };
  }

  if (action.type === "CALENDAR_SUMMARY_LOADED") {
    return { ...state, calendarSummary: action.summary };
  }

  if (action.type === "TODO_FORM_CHANGED") {
    return { ...state, form: { ...state.form, [action.field]: action.value } };
  }

  if (action.type === "TODO_FORM_CLEARED") {
    return { ...state, form: { time: "", timeEnabled: false, title: "" } };
  }

  if (action.type === "SELECTED_DATE_CHANGED") {
    return { ...state, selectedDate: action.date };
  }

  if (action.type === "CALENDAR_MONTH_CHANGED") {
    return { ...state, calendarMonth: action.month };
  }

  if (action.type === "EDIT_STARTED") {
    return {
      ...state,
      edit: {
        date: action.todo.date,
        id: action.todo.id,
        time: action.todo.time ?? "",
        title: action.todo.title,
      },
    };
  }

  if (action.type === "EDIT_CHANGED" && state.edit) {
    return { ...state, edit: { ...state.edit, [action.field]: action.value } };
  }

  if (action.type === "EDIT_CLEARED") {
    return { ...state, edit: null };
  }

  if (action.type === "IMPORT_CONFIRMATION_CHANGED") {
    return { ...state, importConfirmationOpen: action.open };
  }

  if (action.type === "MESSAGE_CHANGED") {
    return { ...state, message: action.message };
  }

  return state;
}

async function refreshToday(
  services: RhythmAppServices,
  todayDate: string,
  dispatch: React.Dispatch<TodoAppAction>,
): Promise<void> {
  dispatch({ type: "TODAY_TODOS_LOADED", todos: await services.getTodosByDate.execute(todayDate) });
}

async function refreshSelectedDate(
  services: RhythmAppServices,
  selectedDate: string,
  dispatch: React.Dispatch<TodoAppAction>,
): Promise<void> {
  dispatch({ type: "SELECTED_DATE_TODOS_LOADED", todos: await services.getTodosByDate.execute(selectedDate) });
}

async function refreshCalendarSummary(
  services: RhythmAppServices,
  calendarMonth: string,
  dispatch: React.Dispatch<TodoAppAction>,
): Promise<void> {
  dispatch({ type: "CALENDAR_SUMMARY_LOADED", summary: await services.getTodoCalendarSummary.execute(calendarMonth) });
}

async function refreshTodoViews(
  services: RhythmAppServices,
  state: TodoAppState,
  dispatch: React.Dispatch<TodoAppAction>,
): Promise<void> {
  await refreshToday(services, state.todayDate, dispatch);
  await refreshSelectedDate(services, state.selectedDate, dispatch);
  await refreshCalendarSummary(services, state.calendarMonth, dispatch);
}

function normalizedTodoTime(
  value: string,
  text: TextCatalog,
  dispatch: React.Dispatch<TodoAppAction>,
): { failed: false; value: string | null } | { failed: true } {
  try {
    return { failed: false, value: normalizeOptionalTimeText(value) };
  } catch {
    dispatch({ type: "MESSAGE_CHANGED", message: text.messages.invalidTime });
    return { failed: true };
  }
}

async function runTodoAction(
  action: () => Promise<void>,
  text: TextCatalog,
  dispatch: React.Dispatch<TodoAppAction>,
): Promise<void> {
  try {
    await action();
  } catch (error) {
    dispatch({
      type: "MESSAGE_CHANGED",
      message: formatText(text.messages.backupFailed, { message: actionErrorMessage(error, text) }),
    });
  }
}

function actionErrorMessage(error: unknown, text: TextCatalog): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return text.messages.unknownError;
}
