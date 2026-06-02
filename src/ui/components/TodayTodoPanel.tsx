import type { TextCatalog } from "../textCatalog";
import type { TodoAppViewModel } from "../useTodoApp";
import { todoTitleMaxLength, validateTodoTitleInput } from "../inputValidation";
import { IconButton } from "./IconButton";
import { TimePickerField } from "./TimePickerField";
import { TodoListPanel } from "./TodoListPanel";

interface TodayTodoPanelProps {
  todo: TodoAppViewModel;
  text: TextCatalog;
}

export function TodayTodoPanel({ todo, text }: TodayTodoPanelProps): React.JSX.Element {
  const titleValidation = validateTodoTitleInput(todo.form.title, text);
  const titleErrorId = "today-todo-title-error";
  const titleCounterId = "today-todo-title-counter";
  const titleDescription = [titleValidation.error ? titleErrorId : null, titleValidation.counter ? titleCounterId : null]
    .filter(Boolean)
    .join(" ") || undefined;

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
          aria-describedby={titleDescription}
          aria-invalid={!titleValidation.isValid}
          aria-label={text.todo.today.inputLabel}
          maxLength={todoTitleMaxLength}
          placeholder={text.todo.today.placeholder}
          required={true}
          value={todo.form.title}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => todo.changeTitle(event.target.value)}
        />
        {todo.form.timeEnabled ? (
          <TimePickerField label={text.todo.list.editTime} onChange={todo.changeTime} text={text} value={todo.form.time} />
        ) : (
          <IconButton icon="clock" label={text.todo.actions.addTime} onClick={todo.showTimeInput} />
        )}
        <IconButton disabled={!titleValidation.isValid} icon="plus" label={text.todo.actions.add} type="submit" variant="primary" />
      </form>
      {titleValidation.error ? <p className="field-error" id={titleErrorId}>{titleValidation.error}</p> : null}
      {titleValidation.counter ? <p className="input-hint counter" id={titleCounterId}>{titleValidation.counter}</p> : null}
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
