import type { TodoItemSnapshot } from "../../contexts/todo/domain/TodoItem";

interface TodoEditState {
  id: string;
  title: string;
  date: string;
  timeEnabled: boolean;
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
  onSaveEdit(): Promise<void>;
  onShowEditTimeInput(): void;
  onStartEditing(todo: TodoItemSnapshot): void;
  onToggle(id: string): Promise<void>;
}

export function TodoListPanel({
  edit,
  onCancelEditing,
  onChangeEditDate,
  onChangeEditTime,
  onChangeEditTitle,
  onDelete,
  onSaveEdit,
  onShowEditTimeInput,
  onStartEditing,
  onToggle,
  todos,
}: TodoListPanelProps): React.JSX.Element {
  if (todos.length === 0) {
    return <p className="empty-text">오늘은 아직 적어둔 일이 없습니다.</p>;
  }

  return (
    <ul className="todo-list">
      {todos.map((todo: TodoItemSnapshot): React.JSX.Element => (
        <li className="todo-row" key={todo.id}>
          <input
            aria-label={`${todo.title} 완료`}
            checked={todo.completed}
            onChange={() => void onToggle(todo.id)}
            type="checkbox"
          />
          {edit?.id === todo.id ? (
            <div className="todo-edit">
              <input
                aria-label="Todo 제목 수정"
                value={edit.title}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChangeEditTitle(event.target.value)}
              />
              <input
                aria-label="Todo 날짜 수정"
                type="date"
                value={edit.date}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChangeEditDate(event.target.value)}
              />
              {edit.timeEnabled ? (
                <input
                  aria-label="Todo 시간 수정"
                  type="time"
                  value={edit.time}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChangeEditTime(event.target.value)}
                />
              ) : (
                <button className="link-button" onClick={onShowEditTimeInput} type="button">시간 추가</button>
              )}
              <div className="todo-actions">
                <button className="mini-button" onClick={() => void onSaveEdit()} type="button">저장</button>
                <button className="mini-button subtle" onClick={onCancelEditing} type="button">취소</button>
              </div>
            </div>
          ) : (
            <>
              <div className="todo-copy">
                <span className={todo.completed ? "todo-title done" : "todo-title"}>{todo.title}</span>
                <span className="todo-meta">{todo.time ?? "시간 없음"}</span>
              </div>
              <div className="todo-actions">
                <button className="mini-button subtle" onClick={() => onStartEditing(todo)} type="button">수정</button>
                <button className="mini-button danger" onClick={() => void onDelete(todo.id)} type="button">삭제</button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
