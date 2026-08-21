import { formatText, type TextCatalog } from "../../../ui/textCatalog";
import type { DataTransferViewModel } from "./useDataTransfer";

interface DataManagementPanelProps {
  dataTransfer: DataTransferViewModel;
  text: TextCatalog;
}

export function DataManagementPanel({ dataTransfer, text }: DataManagementPanelProps): React.JSX.Element {
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
        <button className="btn secondary compact" onClick={() => void dataTransfer.exportBackup()} type="button">
          {text.backup.export}
        </button>
        <button className="btn compact" onClick={dataTransfer.requestImportBackup} type="button">
          {text.backup.import}
        </button>
      </div>
      {dataTransfer.message ? <p className="status-message">{dataTransfer.message}</p> : null}
      {dataTransfer.importConfirmationOpen ? (
        <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="backup-import-title">
          <div className="confirm-dialog">
            <h3 id="backup-import-title">{text.backup.importConfirmTitle}</h3>
            <p>{text.backup.importConfirmDescription}</p>
            {dataTransfer.preparedImport ? (
              <ul className="backup-summary">
                <li>{formatText(text.backup.summaryTodos, { count: dataTransfer.preparedImport.summary.todoCount })}</li>
                <li>{formatText(text.backup.summaryTerms, {
                    focus: dataTransfer.preparedImport.summary.focusMinutes,
                    rest: dataTransfer.preparedImport.summary.restMinutes,
                  })}</li>
                <li>{formatText(text.backup.summaryLanguage, { language: dataTransfer.preparedImport.summary.language })}</li>
                <li>{formatText(text.backup.summaryExportedAt, { exportedAt: dataTransfer.preparedImport.summary.exportedAt })}</li>
              </ul>
            ) : null}
            <div className="todo-edit-actions">
              <button className="mini-button subtle" onClick={dataTransfer.cancelImportBackup} type="button">
                {text.backup.cancel}
              </button>
              <button className="mini-button" onClick={() => void dataTransfer.confirmImportBackup()} type="button">
                {text.backup.confirmImport}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
