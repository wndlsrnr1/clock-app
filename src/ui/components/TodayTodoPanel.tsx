import type { TodoAppViewModel } from "../useTodoApp";
import { TodoListPanel } from "./TodoListPanel";

interface TodayTodoPanelProps {
  todo: TodoAppViewModel;
}

export function TodayTodoPanel({ todo }: TodayTodoPanelProps): React.JSX.Element {
  return (
    <section className="todo-panel" aria-labelledby="today-todo-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Today</p>
          <h2 id="today-todo-title">오늘 할 일</h2>
        </div>
        <span className="date-pill">{todo.todayDate}</span>
      </div>
      <form
        className="todo-form"
        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          void todo.addTodayTodo();
        }}
      >
        <input
          aria-label="오늘 할 일 입력"
          placeholder="할 일을 적어두세요"
          value={todo.form.title}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => todo.changeTitle(event.target.value)}
        />
        {todo.form.timeEnabled ? (
          <input
            aria-label="오늘 할 일 시간"
            type="time"
            value={todo.form.time}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => todo.changeTime(event.target.value)}
          />
        ) : (
          <button className="btn secondary compact" onClick={todo.showTimeInput} type="button">시간 추가</button>
        )}
        <button className="btn compact" type="submit">추가</button>
      </form>
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
        todos={todo.todayTodos}
      />
    </section>
  );
}
