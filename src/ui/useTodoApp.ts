import { useEffect, useReducer } from "react";
import type { TodoDaySummary } from "../contexts/todo/domain/TodoList";
import type { TodoItemSnapshot } from "../contexts/todo/domain/TodoItem";
import type { GoogleTaskListSnapshot, RhythmAppServices } from "./RhythmAppServices";
import { currentMonthKey, formatDateKey } from "./dateFormat";

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
  timeEnabled: boolean;
  time: string;
}

interface GoogleTasksState {
  clientId: string;
  authorizationCode: string;
  taskLists: Array<GoogleTaskListSnapshot>;
  selectedTaskListId: string;
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
  google: GoogleTasksState;
  message: string;
}

type TodoAppAction =
  | { type: "PAGE_CHANGED"; page: AppPage }
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
  | { type: "GOOGLE_CHANGED"; field: keyof GoogleTasksState; value: string | Array<GoogleTaskListSnapshot> }
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
  google: GoogleTasksState;
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
  showEditTimeInput(): void;
  cancelEditing(): void;
  saveEdit(): Promise<void>;
  selectDate(date: string): Promise<void>;
  changeCalendarMonth(month: string): Promise<void>;
  changeGoogleClientId(clientId: string): void;
  saveGoogleClientId(): Promise<void>;
  beginGoogleAuthorization(): Promise<void>;
  changeAuthorizationCode(code: string): void;
  completeGoogleAuthorization(): Promise<void>;
  loadGoogleTaskLists(): Promise<void>;
  selectGoogleTaskList(taskListId: string): Promise<void>;
  syncGoogleTodos(): Promise<void>;
}

export function useTodoApp(services: RhythmAppServices, initialNow: Date): TodoAppViewModel {
  const [state, dispatch] = useReducer(reducer, createInitialState(initialNow));

  useEffect((): void => {
    void refreshToday(services, state.todayDate, dispatch);
    void refreshSelectedDate(services, state.selectedDate, dispatch);
    void refreshCalendarSummary(services, state.calendarMonth, dispatch);
  }, [services, state.todayDate, state.selectedDate, state.calendarMonth]);

  return {
    ...state,
    addTodayTodo: async (): Promise<void> => {
      await services.addTodo.execute({
        date: state.todayDate,
        time: state.form.timeEnabled ? state.form.time : null,
        title: state.form.title,
      });
      dispatch({ type: "TODO_FORM_CLEARED" });
      await refreshTodoViews(services, state, dispatch);
    },
    beginGoogleAuthorization: async (): Promise<void> => {
      const authorizationUrl = await services.beginGoogleAuthorization.execute();
      dispatch({ type: "MESSAGE_CHANGED", message: `인증 URL을 열었습니다. 리디렉션 URL의 code 값을 붙여넣어 주세요. ${authorizationUrl}` });
    },
    cancelEditing: (): void => dispatch({ type: "EDIT_CLEARED" }),
    changeAuthorizationCode: (code: string): void => dispatch({ type: "GOOGLE_CHANGED", field: "authorizationCode", value: code }),
    changeCalendarMonth: async (month: string): Promise<void> => {
      dispatch({ type: "CALENDAR_MONTH_CHANGED", month });
      await refreshCalendarSummary(services, month, dispatch);
    },
    changeEditDate: (date: string): void => dispatch({ type: "EDIT_CHANGED", field: "date", value: date }),
    changeEditTime: (time: string): void => dispatch({ type: "EDIT_CHANGED", field: "time", value: time }),
    changeEditTitle: (title: string): void => dispatch({ type: "EDIT_CHANGED", field: "title", value: title }),
    changeGoogleClientId: (clientId: string): void => dispatch({ type: "GOOGLE_CHANGED", field: "clientId", value: clientId }),
    changeTime: (time: string): void => dispatch({ type: "TODO_FORM_CHANGED", field: "time", value: time }),
    changeTitle: (title: string): void => dispatch({ type: "TODO_FORM_CHANGED", field: "title", value: title }),
    completeGoogleAuthorization: async (): Promise<void> => {
      await services.completeGoogleAuthorization.execute(state.google.authorizationCode);
      dispatch({ type: "MESSAGE_CHANGED", message: "Google Tasks 인증을 저장했습니다." });
    },
    deleteTodo: async (id: string): Promise<void> => {
      await services.deleteTodo.execute(id);
      await refreshTodoViews(services, state, dispatch);
    },
    loadGoogleTaskLists: async (): Promise<void> => {
      const taskLists = await services.listGoogleTaskLists.execute();
      dispatch({ type: "GOOGLE_CHANGED", field: "taskLists", value: taskLists });
    },
    saveEdit: async (): Promise<void> => {
      if (!state.edit) {
        return;
      }

      await services.updateTodo.execute({
        date: state.edit.date,
        id: state.edit.id,
        time: state.edit.timeEnabled ? state.edit.time : null,
        title: state.edit.title,
      });
      dispatch({ type: "EDIT_CLEARED" });
      await refreshTodoViews(services, state, dispatch);
    },
    saveGoogleClientId: async (): Promise<void> => {
      await services.saveGoogleClientId.execute(state.google.clientId);
      dispatch({ type: "MESSAGE_CHANGED", message: "Google Client ID를 저장했습니다." });
    },
    selectDate: async (date: string): Promise<void> => {
      dispatch({ type: "SELECTED_DATE_CHANGED", date });
      await refreshSelectedDate(services, date, dispatch);
    },
    selectGoogleTaskList: async (taskListId: string): Promise<void> => {
      await services.selectGoogleTaskList.execute(taskListId);
      dispatch({ type: "GOOGLE_CHANGED", field: "selectedTaskListId", value: taskListId });
      dispatch({ type: "MESSAGE_CHANGED", message: "Google Tasks 목록을 선택했습니다." });
    },
    showCalendar: async (): Promise<void> => {
      dispatch({ type: "PAGE_CHANGED", page: "calendar" });
      await refreshCalendarSummary(services, state.calendarMonth, dispatch);
    },
    showClock: async (): Promise<void> => {
      dispatch({ type: "PAGE_CHANGED", page: "clock" });
      await refreshToday(services, state.todayDate, dispatch);
    },
    showEditTimeInput: (): void => dispatch({ type: "EDIT_CHANGED", field: "timeEnabled", value: true }),
    showTimeInput: (): void => dispatch({ type: "TODO_FORM_CHANGED", field: "timeEnabled", value: true }),
    startEditing: (todo: TodoItemSnapshot): void => dispatch({ type: "EDIT_STARTED", todo }),
    syncGoogleTodos: async (): Promise<void> => {
      const result = await services.syncGoogleTodos.execute();
      dispatch({ type: "MESSAGE_CHANGED", message: `Google 동기화 완료: 업로드 ${result.uploaded}, 가져오기 ${result.imported}, 업데이트 ${result.updated}` });
      await refreshTodoViews(services, state, dispatch);
    },
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
    google: { authorizationCode: "", clientId: "", selectedTaskListId: "", taskLists: [] },
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
        timeEnabled: action.todo.time !== null,
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

  if (action.type === "GOOGLE_CHANGED") {
    return { ...state, google: { ...state.google, [action.field]: action.value } };
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
