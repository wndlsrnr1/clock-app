import type { TodoAppViewModel } from "../useTodoApp";

interface GoogleTasksPanelProps {
  todo: TodoAppViewModel;
}

export function GoogleTasksPanel({ todo }: GoogleTasksPanelProps): React.JSX.Element {
  return (
    <section className="google-panel" aria-labelledby="google-title">
      <div className="panel-header compact-header">
        <div>
          <p className="eyebrow">Google</p>
          <h2 id="google-title">Google Tasks</h2>
        </div>
      </div>
      <div className="google-grid">
        <label>
          <span className="label">Client ID</span>
          <input
            aria-label="Google Client ID"
            value={todo.google.clientId}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => todo.changeGoogleClientId(event.target.value)}
          />
        </label>
        <button className="btn secondary compact" onClick={() => void todo.saveGoogleClientId()} type="button">Client ID 저장</button>
        <button className="btn secondary compact" onClick={() => void todo.beginGoogleAuthorization()} type="button">인증 URL 열기</button>
        <label>
          <span className="label">인증 code 또는 redirect URL</span>
          <input
            aria-label="Google 인증 코드"
            value={todo.google.authorizationCode}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => todo.changeAuthorizationCode(event.target.value)}
          />
        </label>
        <button className="btn secondary compact" onClick={() => void todo.completeGoogleAuthorization()} type="button">인증 저장</button>
        <button className="btn secondary compact" onClick={() => void todo.loadGoogleTaskLists()} type="button">목록 불러오기</button>
        <label>
          <span className="label">Tasks 목록</span>
          <select
            aria-label="Google Tasks 목록"
            value={todo.google.selectedTaskListId}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => void todo.selectGoogleTaskList(event.target.value)}
          >
            <option value="">선택</option>
            {todo.google.taskLists.map((taskList): React.JSX.Element => (
              <option key={taskList.id} value={taskList.id}>{taskList.title}</option>
            ))}
          </select>
        </label>
        <button className="btn compact" onClick={() => void todo.syncGoogleTodos()} type="button">수동 동기화</button>
      </div>
      {todo.message ? <p className="status-message">{todo.message}</p> : null}
    </section>
  );
}
