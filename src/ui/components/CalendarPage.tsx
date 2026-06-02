import type { LanguagePreference } from "../../contexts/preferences/domain/UserPreferences";
import type { TodoAppViewModel } from "../useTodoApp";
import { calendarDays, type CalendarDayCell } from "../calendarDays";
import { formatMonthLabel } from "../dateFormat";
import { formatText, type TextCatalog } from "../textCatalog";
import { GoogleTasksPanel } from "./GoogleTasksPanel";
import { TodoListPanel } from "./TodoListPanel";

interface CalendarPageProps {
  language: LanguagePreference;
  todo: TodoAppViewModel;
  text: TextCatalog;
}

export function CalendarPage({ language, text, todo }: CalendarPageProps): React.JSX.Element {
  const monthLabel = formatMonthLabel(todo.calendarMonth, language);

  return (
    <section className="calendar-page" aria-labelledby="calendar-title">
      <div className="panel-header calendar-page-header">
        <div>
          <p className="eyebrow">{text.calendar.eyebrow}</p>
          <h2 id="calendar-title">{text.calendar.title}</h2>
        </div>
      </div>
      <div className="calendar-layout">
        <section className="calendar-board" aria-labelledby="calendar-month-title">
          <div className="calendar-toolbar">
            <div>
              <p className="eyebrow">{text.calendar.monthEyebrow}</p>
              <h3 id="calendar-month-title">{monthLabel}</h3>
            </div>
            <div className="calendar-nav">
              <button className="icon-button" aria-label={text.calendar.previousMonth} onClick={() => void todo.moveCalendarMonth(-1)} type="button">‹</button>
              <button className="mini-button subtle" onClick={() => void todo.goToTodayMonth()} type="button">{text.calendar.today}</button>
              <button className="icon-button" aria-label={text.calendar.nextMonth} onClick={() => void todo.moveCalendarMonth(1)} type="button">›</button>
            </div>
          </div>
          <div className="calendar-weekdays" aria-hidden="true">
            {text.calendar.weekdays.map((weekday: string): React.JSX.Element => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div className="calendar-grid" role="grid" aria-label={formatText(text.calendar.gridLabel, { month: monthLabel })}>
            {calendarDays(todo.calendarMonth).map((cell: CalendarDayCell, index: number): React.JSX.Element => renderCalendarCell(todo, text, cell, index))}
          </div>
        </section>
        <section className="selected-day-panel" aria-labelledby="selected-date-title">
          <div className="panel-header compact-header">
            <div>
              <p className="eyebrow">{text.calendar.selectedEyebrow}</p>
              <h2 id="selected-date-title">{todo.selectedDate}</h2>
            </div>
          </div>
          <TodoListPanel
            edit={todo.edit}
            onCancelEditing={todo.cancelEditing}
            onChangeEditDate={todo.changeEditDate}
            onChangeEditTime={todo.changeEditTime}
            onChangeEditTitle={todo.changeEditTitle}
            onDelete={todo.deleteTodo}
            onReorder={todo.reorderTodos}
            onSaveEdit={todo.saveEdit}
            onStartEditing={todo.startEditing}
            onToggle={todo.toggleTodo}
            text={text}
            todos={todo.selectedDateTodos}
          />
        </section>
      </div>
      <GoogleTasksPanel text={text} todo={todo} />
    </section>
  );
}

function renderCalendarCell(todo: TodoAppViewModel, text: TextCatalog, cell: CalendarDayCell, index: number): React.JSX.Element {
  if (!cell.date || cell.day === null) {
    return <span className="calendar-day calendar-day-empty" key={`${todo.calendarMonth}-empty-${index}`} role="gridcell" />;
  }

  const date = cell.date;
  const summary = todo.calendarSummary[date];
  const className = calendarDayClassName(date, todo.selectedDate, todo.todayDate, Boolean(summary));

  return (
    <button
      aria-label={`${date} ${summary ? `${summary.completed}/${summary.total}` : text.calendar.noTodo}`}
      className={className}
      key={date}
      onClick={() => void todo.selectDate(date)}
      type="button"
    >
      <span className="calendar-day-number">{cell.day}</span>
      {summary ? <span className="calendar-todo-badge">{summary.completed}/{summary.total}</span> : null}
    </button>
  );
}

function calendarDayClassName(date: string, selectedDate: string, todayDate: string, hasTodo: boolean): string {
  return [
    "calendar-day",
    selectedDate === date ? "selected" : "",
    todayDate === date ? "today" : "",
    hasTodo ? "has-todo" : "",
  ].filter(Boolean).join(" ");
}
