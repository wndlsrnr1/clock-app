import type { NotificationSoundFilePort, SelectedNotificationSound } from "../../contexts/preferences/application/ports/NotificationSoundFilePort";

interface BrowserFilePicker {
  chooseMp3(): Promise<File | null>;
}

type ObjectUrlFactory = (file: File) => string;

export class BrowserPreviewNotificationSoundFileAdapter implements NotificationSoundFilePort {
  private readonly maxMp3Bytes = 20 * 1024 * 1024;

  public constructor(
    private readonly filePicker: BrowserFilePicker = new HiddenInputBrowserFilePicker(),
    private readonly createObjectUrl: ObjectUrlFactory = (file: File): string => URL.createObjectURL(file),
  ) {}

  public async chooseCustomMp3(): Promise<SelectedNotificationSound | null> {
    const file = await this.filePicker.chooseMp3();

    if (!file) {
      return null;
    }

    if (!this.isValidMp3(file)) {
      throw new Error("20MB 이하의 mp3 파일만 알림음으로 사용할 수 있습니다.");
    }

    return {
      fileName: file.name,
      source: this.createObjectUrl(file),
    };
  }

  private isValidMp3(file: File): boolean {
    return file.size <= this.maxMp3Bytes && file.name.trim().toLowerCase().endsWith(".mp3");
  }
}

class HiddenInputBrowserFilePicker implements BrowserFilePicker {
  public async chooseMp3(): Promise<File | null> {
    return new Promise<File | null>((resolve: (file: File | null) => void): void => {
      const input = document.createElement("input");
      input.accept = ".mp3,audio/mpeg";
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
