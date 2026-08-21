import { filesystem, os } from "@neutralinojs/lib";
import type { BackupFilePort } from "../../application/ports";

interface NeutralinoBackupOsPort {
  showSaveDialog(title?: string, options?: {
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: Array<string> }>;
  }): Promise<string>;
  showOpenDialog(title?: string, options?: {
    filters?: Array<{ name: string; extensions: Array<string> }>;
    multiSelections?: boolean;
  }): Promise<Array<string>>;
}

interface NeutralinoBackupFilesystemPort {
  writeFile(path: string, data: string): Promise<void>;
  readFile(path: string): Promise<string>;
}

export class NeutralinoBackupFileAdapter implements BackupFilePort {
  public constructor(
    private readonly neutralinoOs: NeutralinoBackupOsPort = os,
    private readonly neutralinoFilesystem: NeutralinoBackupFilesystemPort = filesystem,
  ) {}

  public async saveBackup(text: string): Promise<void> {
    const path = await this.neutralinoOs.showSaveDialog("Clock Rhythm backup 내보내기", {
      defaultPath: "clock-rhythm-backup.json",
      filters: [{ extensions: ["json"], name: "JSON" }],
    });

    if (!path) {
      return;
    }

    await this.neutralinoFilesystem.writeFile(path, text);
  }

  public async readBackup(): Promise<string | null> {
    const paths = await this.neutralinoOs.showOpenDialog("Clock Rhythm backup 가져오기", {
      filters: [{ extensions: ["json"], name: "JSON" }],
      multiSelections: false,
    });
    const path = paths[0];

    if (!path) {
      return null;
    }

    return this.neutralinoFilesystem.readFile(path);
  }
}
