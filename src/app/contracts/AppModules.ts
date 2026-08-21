import type { PreferencesModule } from "../../contexts/preferences/public";
import type { RhythmModule } from "../../contexts/rhythm/public";
import type { TodoModule } from "../../contexts/todo/public";
import type { DataTransferModule } from "../../features/data-transfer/public";

export interface AppModules {
  rhythm: RhythmModule;
  preferences: PreferencesModule;
  todo: TodoModule;
  dataTransfer: DataTransferModule;
}
