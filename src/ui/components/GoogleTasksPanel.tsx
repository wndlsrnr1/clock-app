import { formatText, type TextCatalog } from "../textCatalog";
import type { TodoAppViewModel } from "../useTodoApp";
import { GoogleTaskStep } from "./GoogleTaskStep";

interface GoogleTasksPanelProps {
  todo: TodoAppViewModel;
  text: TextCatalog;
}

export function GoogleTasksPanel({ text, todo }: GoogleTasksPanelProps): React.JSX.Element {
  return (
    <section className="google-panel" aria-labelledby="google-title">
      <div className="panel-header compact-header">
        <div>
          <p className="eyebrow">{text.googleTasks.eyebrow}</p>
          <h2 id="google-title">{text.googleTasks.title}</h2>
        </div>
      </div>
      <div className="google-steps">
        <GoogleTaskStep
          description={text.googleTasks.clientIdHelp}
          helpId="google-client-id-help"
          helpLabel={formatText(text.googleTasks.help, { title: text.googleTasks.clientIdTitle })}
          title={text.googleTasks.clientIdTitle}
        >
          <div className="google-step-grid">
            <label className="field-label">
              <span className="label">{text.googleTasks.clientIdLabel}</span>
              <input
                aria-label="Google Client ID"
                value={todo.google.clientId}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => todo.changeGoogleClientId(event.target.value)}
              />
            </label>
            <button className="btn secondary compact google-action" onClick={() => void todo.saveGoogleClientId()} type="button">{text.todo.actions.save}</button>
          </div>
        </GoogleTaskStep>
        <GoogleTaskStep
          description={text.googleTasks.authHelp}
          helpId="google-auth-help"
          helpLabel={formatText(text.googleTasks.help, { title: text.googleTasks.authTitle })}
          title={text.googleTasks.authTitle}
        >
          <div className="google-step-grid google-auth-grid">
            <button className="btn secondary compact google-action" onClick={() => void todo.beginGoogleAuthorization()} type="button">{text.googleTasks.authOpen}</button>
            <label className="field-label">
              <span className="label">{text.googleTasks.authCodeLabel}</span>
              <input
                aria-label={text.googleTasks.authCodeAria}
                value={todo.google.authorizationCode}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => todo.changeAuthorizationCode(event.target.value)}
              />
            </label>
            <button className="btn secondary compact google-action" onClick={() => void todo.completeGoogleAuthorization()} type="button">{text.googleTasks.authSave}</button>
          </div>
        </GoogleTaskStep>
        <GoogleTaskStep
          description={text.googleTasks.taskListHelp}
          helpId="google-task-list-help"
          helpLabel={formatText(text.googleTasks.help, { title: text.googleTasks.taskListTitle })}
          title={text.googleTasks.taskListTitle}
        >
          <div className="google-step-grid google-task-list-grid">
            <button className="btn secondary compact google-action" onClick={() => void todo.loadGoogleTaskLists()} type="button">{text.googleTasks.taskListLoad}</button>
            <label className="field-label">
              <span className="label">{text.googleTasks.taskListLabel}</span>
              <select
                aria-label={text.googleTasks.taskListAria}
                value={todo.google.selectedTaskListId}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => void todo.selectGoogleTaskList(event.target.value)}
              >
                <option value="">{text.googleTasks.taskListPlaceholder}</option>
                {todo.google.taskLists.map((taskList): React.JSX.Element => (
                  <option key={taskList.id} value={taskList.id}>{taskList.title}</option>
                ))}
              </select>
            </label>
            <button className="btn compact google-action" onClick={() => void todo.syncGoogleTodos()} type="button">{text.googleTasks.taskListSync}</button>
          </div>
        </GoogleTaskStep>
      </div>
      {todo.message ? <p className="status-message">{todo.message}</p> : null}
    </section>
  );
}
