import { filesystem, os, server } from "@neutralinojs/lib";
import type { NotificationSoundFilePort, SelectedNotificationSound } from "../../application/ports/NotificationSoundFilePort";

interface OpenDialogPort {
  showOpenDialog(title: string, options: { filters: Array<{ name: string; extensions: Array<string> }>; multiSelections: boolean }): Promise<Array<string>>;
}

interface FilesystemPort {
  createDirectory(path: string): Promise<void>;
  getPathParts(path: string): Promise<{ filename: string }>;
  getStats(path: string): Promise<{ isFile: boolean; size: number }>;
  readBinaryFile(path: string): Promise<ArrayBuffer>;
  writeBinaryFile(path: string, data: ArrayBuffer): Promise<void>;
}

interface ServerMountPort {
  getMounts(): Promise<Record<string, string>>;
  mount(path: string, target: string): Promise<void>;
}

export interface NeutralinoDataPaths {
  dataPath: string;
}

export class NeutralinoNotificationSoundFileAdapter implements NotificationSoundFilePort {
  private readonly maxMp3Bytes = 20 * 1024 * 1024;

  public constructor(
    private readonly dialog: OpenDialogPort = os,
    private readonly neutralinoFilesystem: FilesystemPort = filesystem,
    private readonly neutralinoServer: ServerMountPort = server,
    private readonly paths: NeutralinoDataPaths = { dataPath: globalThis.NL_DATAPATH ?? "." },
  ) {}

  public async chooseCustomMp3(): Promise<SelectedNotificationSound | null> {
    const entries = await this.dialog.showOpenDialog("알림음 mp3 선택", {
      filters: [{ name: "MP3", extensions: ["mp3"] }],
      multiSelections: false,
    });

    if (entries.length === 0) {
      return null;
    }

    const selectedPath = entries[0];
    const stats = await this.neutralinoFilesystem.getStats(selectedPath);
    const parts = await this.neutralinoFilesystem.getPathParts(selectedPath);

    if (!stats.isFile || stats.size > this.maxMp3Bytes || !parts.filename.toLowerCase().endsWith(".mp3")) {
      throw new Error("20MB 이하의 mp3 파일만 알림음으로 사용할 수 있습니다.");
    }

    const soundsDirectory = this.soundsDirectory();
    const targetPath = `${soundsDirectory}/notification.mp3`;
    const binarySound = await this.neutralinoFilesystem.readBinaryFile(selectedPath);

    await this.neutralinoFilesystem.createDirectory(soundsDirectory);
    await this.neutralinoFilesystem.writeBinaryFile(targetPath, binarySound);
    await this.mountSoundsDirectory(soundsDirectory);

    return {
      fileName: parts.filename,
      source: "/user-sounds/notification.mp3",
    };
  }

  public async restoreCustomSoundMount(): Promise<boolean> {
    const soundsDirectory = this.soundsDirectory();

    try {
      await this.neutralinoFilesystem.getStats(soundsDirectory);
      await this.mountSoundsDirectory(soundsDirectory);
      return true;
    } catch {
      return false;
    }
  }

  private soundsDirectory(): string {
    return `${this.paths.dataPath}/sounds`;
  }

  private async mountSoundsDirectory(soundsDirectory: string): Promise<void> {
    const mounts = await this.neutralinoServer.getMounts();

    if (mounts["/user-sounds"] === soundsDirectory) {
      return;
    }

    await this.neutralinoServer.mount("/user-sounds", soundsDirectory);
  }
}
