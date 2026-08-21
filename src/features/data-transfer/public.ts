import type { PreparedBackupImport } from "../../contexts/backup/application/BackupUseCases";

export {
  ExportBackupUseCase,
  ImportBackupUseCase,
  PreviewBackupImportUseCase,
  type PreparedBackupImport,
} from "../../contexts/backup/application/BackupUseCases";

export interface DataTransferModule {
  exportBackup: { execute(): Promise<void> };
  previewImport: { execute(): Promise<PreparedBackupImport | null> };
  importBackup: { execute(preparedImport: PreparedBackupImport): Promise<void> };
}
