import { useState } from "react";
import type { TodoItemSnapshot } from "../../contexts/todo/domain/TodoItem";
import { formatText, type TextCatalog } from "../textCatalog";
import { todoTitleMaxLength, validateTodoTitleInput } from "../inputValidation";
import { IconButton } from "./IconButton";
import { SvgIcon } from "./SvgIcon";
import { TimePickerField } from "./TimePickerField";

interface TodoEditState {
  id: string;
  title: string;
  date: string;
  time: string;
}

interface TodoListPanelProps {
  todos: Array<TodoItemSnapshot>;
  edit: TodoEditState | null;
  onCancelEditing(): void;
  onChangeEditDate(date: string): void;
  onChangeEditTime(time: string): void;
  onChangeEditTitle(title: string): void;
  onDelete(id: string): Promise<void>;
  onReorder(date: string, orderedIds: Array<string>): Promise<void>;
  onSaveEdit(): Promise<void>;
  onStartEditing(todo: TodoItemSnapshot): void;
  onToggle(id: string): Promise<void>;
  text: TextCatalog;
}

export function TodoListPanel({
  edit,
  onCancelEditing,
  onChangeEditDate,
  onChangeEditTime,
  onChangeEditTitle,
  onDelete,
  onReorder,
  onSaveEdit,
  onStartEditing,
  onToggle,
  text,
  todos,
}: TodoListPanelProps): React.JSX.Element {
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
  const editTitleValidation = edit ? validateTodoTitleInput(edit.title, text) : null;
  const editTitleErrorId = edit ? `todo-edit-title-error-${edit.id}` : undefined;
  const editTitleCounterId = edit ? `todo-edit-title-counter-${edit.id}` : undefined;
  const editTitleDescription = [
    editTitleValidation?.error ? editTitleErrorId : null,
    editTitleValidation?.counter ? editTitleCounterId : null,
  ].filter(Boolean).join(" ") || undefined;

  if (todos.length === 0) {
    return <p className="empty-text">{text.todo.list.empty}</p>;
  }

  return (
    <ul className="todo-list">
      {todos.map((todo: TodoItemSnapshot): React.JSX.Element => (
        <li
          className={draggedTodoId === todo.id ? "todo-row dragging" : "todo-row"}
          key={todo.id}
          onDragOver={(event: React.DragEvent<HTMLLIElement>) => {
            if (canDropWithinGroup(todos, draggedTodoId, todo.id)) {
              event.preventDefault();
            }
          }}
          onDrop={(event: React.DragEvent<HTMLLIElement>) => {
            const orderedIds = reorderedGroupIds(todos, event.dataTransfer.getData("text/plain") || draggedTodoId, todo.id);
            event.preventDefault();
            setDraggedTodoId(null);

            if (orderedIds) {
              void onReorder(todo.date, orderedIds);
            }
          }}
        >
          <button
            aria-label={formatText(text.todo.actions.drag, { title: todo.title })}
            className="icon-action icon-action-subtle todo-drag-handle"
            draggable={true}
            onDragEnd={() => setDraggedTodoId(null)}
            onDragStart={(event: React.DragEvent<HTMLButtonElement>) => {
              setDraggedTodoId(todo.id);
              event.dataTransfer.setData("text/plain", todo.id);
            }}
            title={formatText(text.todo.actions.drag, { title: todo.title })}
            type="button"
          >
            <SvgIcon name="grip" />
          </button>
          <input
            aria-label={formatText(text.todo.actions.complete, { title: todo.title })}
            checked={todo.completed}
            onChange={() => void onToggle(todo.id)}
            type="checkbox"
          />
          {edit?.id === todo.id ? (
            <div
              className="todo-edit"
              onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void onSaveEdit();
                  return;
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  onCancelEditing();
                }
              }}
            >
              <input
                aria-describedby={editTitleDescription}
                aria-invalid={editTitleValidation ? !editTitleValidation.isValid : false}
                aria-label={text.todo.list.editTitle}
                maxLength={todoTitleMaxLength}
                required={true}
                value={edit.title}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChangeEditTitle(event.target.value)}
              />
              <div className="field-feedback">
                {editTitleValidation?.error && editTitleErrorId ? <p className="field-error" id={editTitleErrorId}>{editTitleValidation.error}</p> : null}
                {editTitleValidation?.counter && editTitleCounterId ? <p className="input-hint counter" id={editTitleCounterId}>{editTitleValidation.counter}</p> : null}
              </div>
              <input
                aria-label={text.todo.list.editDate}
                required={true}
                type="date"
                value={edit.date}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChangeEditDate(event.target.value)}
              />
              <TimePickerField
                label={text.todo.list.editTime}
                onCancel={onCancelEditing}
                onChange={onChangeEditTime}
                onCommit={() => void onSaveEdit()}
                text={text}
                value={edit.time}
              />
              <div className="todo-edit-actions">
                <IconButton disabled={editTitleValidation ? !editTitleValidation.isValid : false} icon="check" label={text.todo.actions.save} onClick={() => void onSaveEdit()} variant="primary" />
                <IconButton icon="x" label={text.todo.actions.cancel} onClick={onCancelEditing} variant="subtle" />
              </div>
            </div>
          ) : (
            <>
              <div className="todo-copy">
                <span className={todo.completed ? "todo-title done" : "todo-title"}>{todo.title}</span>
                {todo.time ? <span className="todo-meta">{todo.time}</span> : null}
              </div>
              <div className="todo-actions">
                <IconButton icon="pencil" label={text.todo.actions.edit} onClick={() => onStartEditing(todo)} variant="subtle" />
                <IconButton icon="trash" label={text.todo.actions.delete} onClick={() => void onDelete(todo.id)} variant="danger" />
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

function canDropWithinGroup(todos: Array<TodoItemSnapshot>, draggedTodoId: string | null, targetTodoId: string): boolean {
  return Boolean(reorderedGroupIds(todos, draggedTodoId, targetTodoId));
}

function reorderedGroupIds(
  todos: Array<TodoItemSnapshot>,
  draggedTodoId: string | null,
  targetTodoId: string,
): Array<string> | null {
  const draggedTodo = todos.find((todo: TodoItemSnapshot): boolean => todo.id === draggedTodoId);
  const targetTodo = todos.find((todo: TodoItemSnapshot): boolean => todo.id === targetTodoId);

  if (!draggedTodo || !targetTodo || draggedTodo.id === targetTodo.id || !sameCompletionGroup(draggedTodo, targetTodo)) {
    return null;
  }

  const groupIds = groupTodoIds(todos, targetTodo);
  const nextGroupIds = groupIds.filter((id: string): boolean => id !== draggedTodo.id);
  const draggedIndex = groupIds.indexOf(draggedTodo.id);
  const targetIndex = groupIds.indexOf(targetTodo.id);
  const nextTargetIndex = nextGroupIds.indexOf(targetTodo.id);
  const insertionIndex = draggedIndex < targetIndex ? nextTargetIndex + 1 : nextTargetIndex;
  nextGroupIds.splice(insertionIndex, 0, draggedTodo.id);

  return nextGroupIds;
}

function groupTodoIds(todos: Array<TodoItemSnapshot>, todo: TodoItemSnapshot): Array<string> {
  return todos
    .filter((candidate: TodoItemSnapshot): boolean => sameCompletionGroup(candidate, todo))
    .map((candidate: TodoItemSnapshot): string => candidate.id);
}

function sameCompletionGroup(left: TodoItemSnapshot, right: TodoItemSnapshot): boolean {
  return left.date === right.date && left.completed === right.completed;
}
