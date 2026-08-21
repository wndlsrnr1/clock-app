import type { BackupFilePort } from "../../application/ports";

interface BrowserBackupFilePicker {
  chooseJson(): Promise<File | null>;
}

type ObjectUrlFactory = (blob: Blob) => string;

export class BrowserBackupFileAdapter implements BackupFilePort {
  public constructor(
    private readonly filePicker: BrowserBackupFilePicker = new HiddenInputJsonFilePicker(),
    private readonly createObjectUrl: ObjectUrlFactory = (blob: Blob): string => URL.createObjectURL(blob),
    private readonly revokeObjectUrl: (url: string) => void = (url: string): void => URL.revokeObjectURL(url),
  ) {}

  public async saveBackup(text: string): Promise<void> {
    const blobUrl = this.createObjectUrl(new Blob([text], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = "clock-rhythm-backup.json";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    this.revokeObjectUrl(blobUrl);
  }

  public async readBackup(): Promise<string | null> {
    const file = await this.filePicker.chooseJson();

    if (!file) {
      return null;
    }

    return file.text();
  }
}

class HiddenInputJsonFilePicker implements BrowserBackupFilePicker {
  public async chooseJson(): Promise<File | null> {
    return new Promise<File | null>((resolve: (file: File | null) => void): void => {
      const input = document.createElement("input");
      input.accept = ".json,application/json";
      input.type = "file";
      input.style.opacity = "0";
      input.style.pointerEvents = "none";
      input.style.position = "fixed";

      input.addEventListener("change", (): void => {
        resolve(input.files?.[0] ?? null);
        input.remove();
      }, { once: true });
      input.addEventListener("cancel", (): void => {
        resolve(null);
        input.remove();
      }, { once: true });

      document.body.append(input);
      input.click();
    });
  }
}
