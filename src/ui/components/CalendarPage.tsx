import type { TodoAppViewModel } from "../useTodoApp";
import { calendarDays } from "../calendarDays";
import { GoogleTasksPanel } from "./GoogleTasksPanel";
import { TodoListPanel } from "./TodoListPanel";

interface CalendarPageProps {
  todo: TodoAppViewModel;
}

export function CalendarPage({ todo }: CalendarPageProps): React.JSX.Element {
  return (
    <section className="calendar-page" aria-labelledby="calendar-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Calendar</p>
          <h2 id="calendar-title">Todo 캘린더</h2>
        </div>
        <input
          aria-label="캘린더 월"
          type="month"
          value={todo.calendarMonth}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => void todo.changeCalendarMonth(event.target.value)}
        />
      </div>
      <div className="calendar-layout">
        <div className="calendar-grid" role="grid">
          {calendarDays(todo.calendarMonth).map((cell): React.JSX.Element => {
            const summary = todo.calendarSummary[cell.date];
            const selected = todo.selectedDate === cell.date;

            return (
              <button
                className={selected ? "calendar-day selected" : "calendar-day"}
                key={cell.date}
                onClick={() => void todo.selectDate(cell.date)}
                type="button"
              >
                <span>{cell.day}</span>
                {summary ? <small>{summary.completed}/{summary.total}</small> : null}
              </button>
            );
          })}
        </div>
        <section className="selected-day-panel" aria-labelledby="selected-date-title">
          <div className="panel-header compact-header">
            <div>
              <p className="eyebrow">Selected</p>
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
            onSaveEdit={todo.saveEdit}
            onShowEditTimeInput={todo.showEditTimeInput}
            onStartEditing={todo.startEditing}
            onToggle={todo.toggleTodo}
            todos={todo.selectedDateTodos}
          />
        </section>
      </div>
      <GoogleTasksPanel todo={todo} />
    </section>
  );
}
