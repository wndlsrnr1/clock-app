import { describe, expect, it } from "vitest";
import { NeutralinoNotificationSoundFileAdapter } from "./NeutralinoNotificationSoundFileAdapter";

class FakeDialog {
  public constructor(private readonly entries: Array<string>) {}

  public async showOpenDialog(): Promise<Array<string>> {
    return this.entries;
  }
}

class FakeFilesystem {
  public createdDirectories: Array<string> = [];
  public writtenPath: string | null = null;

  public async createDirectory(path: string): Promise<void> {
    this.createdDirectories.push(path);
  }

  public async getPathParts(path: string): Promise<{ filename: string }> {
    return { filename: path.split(/[\\/]/).at(-1) ?? path };
  }

  public async getStats(): Promise<{ isFile: boolean; size: number }> {
    return { isFile: true, size: 12 };
  }

  public async readBinaryFile(): Promise<ArrayBuffer> {
    return new ArrayBuffer(12);
  }

  public async writeBinaryFile(path: string): Promise<void> {
    this.writtenPath = path;
  }
}

class FakeServer {
  public mounted: Record<string, string> = {};

  public async getMounts(): Promise<Record<string, string>> {
    return this.mounted;
  }

  public async mount(path: string, target: string): Promise<void> {
    this.mounted[path] = target;
  }
}

describe("NeutralinoNotificationSoundFileAdapter", () => {
  it("copies a selected mp3 into app data and returns the mounted source", async () => {
    const filesystem = new FakeFilesystem();
    const server = new FakeServer();
    const adapter = new NeutralinoNotificationSoundFileAdapter(
      new FakeDialog(["C:\\Users\\me\\bell.mp3"]),
      filesystem,
      server,
      { dataPath: "C:/app-data" },
    );

    const selectedSound = await adapter.chooseCustomMp3();

    expect(filesystem.createdDirectories).toEqual(["C:/app-data/sounds"]);
    expect(filesystem.writtenPath).toBe("C:/app-data/sounds/notification.mp3");
    expect(server.mounted["/user-sounds"]).toBe("C:/app-data/sounds");
    expect(selectedSound).toEqual({
      fileName: "bell.mp3",
      source: "/user-sounds/notification.mp3",
    });
  });

  it("returns null when the file dialog is cancelled", async () => {
    const adapter = new NeutralinoNotificationSoundFileAdapter(
      new FakeDialog([]),
      new FakeFilesystem(),
      new FakeServer(),
      { dataPath: "C:/app-data" },
    );

    await expect(adapter.chooseCustomMp3()).resolves.toBeNull();
  });
});
