import type { TextCatalog } from "../textCatalog";
import type { TodoAppViewModel } from "../useTodoApp";

interface DataManagementPanelProps {
  todo: TodoAppViewModel;
  text: TextCatalog;
}

export function DataManagementPanel({ text, todo }: DataManagementPanelProps): React.JSX.Element {
  return (
    <section className="data-panel" aria-labelledby="data-management-title">
      <div className="panel-header compact-header">
        <div>
          <p className="eyebrow">{text.backup.eyebrow}</p>
          <h2 id="data-management-title">{text.backup.title}</h2>
        </div>
      </div>
      <p className="panel-copy">{text.backup.description}</p>
      <div className="buttons slim-buttons">
        <button className="btn secondary compact" onClick={() => void todo.exportBackup()} type="button">
          {text.backup.export}
        </button>
        <button className="btn compact" onClick={todo.requestImportBackup} type="button">
          {text.backup.import}
        </button>
      </div>
      {todo.message ? <p className="status-message">{todo.message}</p> : null}
      {todo.importConfirmationOpen ? (
        <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="backup-import-title">
          <div className="confirm-dialog">
            <h3 id="backup-import-title">{text.backup.importConfirmTitle}</h3>
            <p>{text.backup.importConfirmDescription}</p>
            <div className="todo-edit-actions">
              <button className="mini-button subtle" onClick={todo.cancelImportBackup} type="button">
                {text.backup.cancel}
              </button>
              <button className="mini-button" onClick={() => void todo.confirmImportBackup()} type="button">
                {text.backup.confirmImport}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
