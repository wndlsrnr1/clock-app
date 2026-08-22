import { useReducer } from "react";
import type { TextCatalog } from "../../../shared/i18n/catalog";
import { formatText } from "../../../shared/i18n/formatText";
import type { DataTransferModule, PreparedBackupImport } from "../public";

interface DataTransferState {
  importConfirmationOpen: boolean;
  preparedImport: PreparedBackupImport | null;
  message: string;
}

type DataTransferAction =
  | { type: "IMPORT_PREPARED"; preparedImport: PreparedBackupImport }
  | { type: "IMPORT_CLEARED" }
  | { type: "MESSAGE_CHANGED"; message: string };

export interface DataTransferViewModel {
  importConfirmationOpen: boolean;
  preparedImport: PreparedBackupImport | null;
  message: string;
  exportBackup(): Promise<void>;
  requestImportBackup(): void;
  cancelImportBackup(): void;
  confirmImportBackup(): Promise<void>;
}

export function useDataTransfer(
  module: DataTransferModule,
  text: TextCatalog,
  onImported: () => Promise<void>,
): DataTransferViewModel {
  const [state, dispatch] = useReducer(reducer, {
    importConfirmationOpen: false,
    message: "",
    preparedImport: null,
  });

  return {
    ...state,
    cancelImportBackup: (): void => dispatch({ type: "IMPORT_CLEARED" }),
    confirmImportBackup: async (): Promise<void> => {
      const preparedImport = state.preparedImport;

      if (!preparedImport) {
        return;
      }

      await runDataTransferAction(async (): Promise<void> => {
        await module.importBackup.execute(preparedImport);
        dispatch({ type: "IMPORT_CLEARED" });
        dispatch({ type: "MESSAGE_CHANGED", message: text.messages.backupImported });
        await onImported();
      }, text, dispatch);
    },
    exportBackup: async (): Promise<void> => {
      await runDataTransferAction(async (): Promise<void> => {
        await module.exportBackup.execute();
        dispatch({ type: "MESSAGE_CHANGED", message: text.messages.backupExported });
      }, text, dispatch);
    },
    requestImportBackup: (): void => {
      void runDataTransferAction(async (): Promise<void> => {
        const preparedImport = await module.previewImport.execute();

        if (preparedImport) {
          dispatch({ type: "IMPORT_PREPARED", preparedImport });
        }
      }, text, dispatch);
    },
  };
}

function reducer(state: DataTransferState, action: DataTransferAction): DataTransferState {
  if (action.type === "IMPORT_PREPARED") {
    return { ...state, importConfirmationOpen: true, preparedImport: action.preparedImport };
  }

  if (action.type === "IMPORT_CLEARED") {
    return { ...state, importConfirmationOpen: false, preparedImport: null };
  }

  return { ...state, message: action.message };
}

async function runDataTransferAction(
  action: () => Promise<void>,
  text: TextCatalog,
  dispatch: React.Dispatch<DataTransferAction>,
): Promise<void> {
  try {
    await action();
  } catch (error) {
    dispatch({
      type: "MESSAGE_CHANGED",
      message: formatText(text.messages.backupFailed, { message: actionErrorMessage(error, text) }),
    });
  }
}

function actionErrorMessage(error: unknown, text: TextCatalog): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return text.messages.unknownError;
}
