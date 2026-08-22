import { useState } from "react";
import { IconButton } from "../../../../shared/ui/components/IconButton";
import { TimePickerField } from "../../../../shared/ui/components/TimePickerField";
import { todoTitleMaxLength, validateTodoTitleInput } from "../validation/todoTitleValidation";
import type { TextCatalog } from "../../../../shared/i18n/catalog";
import { TodoListPanel } from "../TodoListPanel";
import type { TodoAppViewModel } from "../useTodoApp";

interface TodayTodoPanelProps {
  todo: TodoAppViewModel;
  text: TextCatalog;
}

export function TodayTodoPanel({ todo, text }: TodayTodoPanelProps): React.JSX.Element {
  const [titleTouched, setTitleTouched] = useState(false);
  const titleValidation = validateTodoTitleInput(todo.form.title, text);
  const titleErrorId = "today-todo-title-error";
  const titleCounterId = "today-todo-title-counter";
  const showTitleError = titleTouched && titleValidation.error !== null;
  const titleDescription = [showTitleError ? titleErrorId : null, titleValidation.counter ? titleCounterId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <section className="todo-panel panel-surface" aria-labelledby="today-todo-title">
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
          setTitleTouched(true);
          if (!titleValidation.isValid) {
            return;
          }
          setTitleTouched(false);
          void todo.addTodayTodo();
        }}
      >
        <div className="todo-title-field">
          <input
            aria-describedby={titleDescription}
            aria-invalid={showTitleError}
            aria-label={text.todo.today.inputLabel}
            maxLength={todoTitleMaxLength}
            placeholder={text.todo.today.placeholder}
            required={true}
            value={todo.form.title}
            onBlur={() => setTitleTouched(true)}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setTitleTouched(true);
              todo.changeTitle(event.target.value);
            }}
          />
          <div className="field-feedback">
            {showTitleError ? <p className="field-error" id={titleErrorId}>{titleValidation.error}</p> : null}
            {titleValidation.counter ? <p className="input-hint counter" id={titleCounterId}>{titleValidation.counter}</p> : null}
          </div>
        </div>
        {todo.form.timeEnabled ? (
          <TimePickerField label={text.todo.list.editTime} onChange={todo.changeTime} text={text.timePicker} value={todo.form.time} />
        ) : (
          <IconButton icon="clock" label={text.todo.actions.addTime} onClick={todo.showTimeInput} />
        )}
        <IconButton disabled={!titleValidation.isValid} icon="plus" label={text.todo.actions.add} type="submit" variant="primary" />
      </form>
      {todo.message ? <p className="status-message" role="status">{todo.message}</p> : null}
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
