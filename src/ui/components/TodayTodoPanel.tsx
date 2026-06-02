import type { TextCatalog } from "../textCatalog";
import type { TodoAppViewModel } from "../useTodoApp";
import { IconButton } from "./IconButton";
import { TimePickerField } from "./TimePickerField";
import { TodoListPanel } from "./TodoListPanel";

interface TodayTodoPanelProps {
  todo: TodoAppViewModel;
  text: TextCatalog;
}

export function TodayTodoPanel({ todo, text }: TodayTodoPanelProps): React.JSX.Element {
  return (
    <section className="todo-panel" aria-labelledby="today-todo-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{text.todo.today.eyebrow}</p>
          <h2 id="today-todo-title">{text.todo.today.title}</h2>
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
          aria-label={text.todo.today.inputLabel}
          placeholder={text.todo.today.placeholder}
          value={todo.form.title}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => todo.changeTitle(event.target.value)}
        />
        {todo.form.timeEnabled ? (
          <TimePickerField label={text.todo.list.editTime} onChange={todo.changeTime} text={text} value={todo.form.time} />
        ) : (
          <IconButton icon="clock" label={text.todo.actions.addTime} onClick={todo.showTimeInput} />
        )}
        <IconButton icon="plus" label={text.todo.actions.add} type="submit" variant="primary" />
      </form>
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
        todos={todo.todayTodos}
      />
    </section>
  );
}
