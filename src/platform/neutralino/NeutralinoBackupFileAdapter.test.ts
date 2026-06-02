import { describe, expect, it } from "vitest";
import { NeutralinoBackupFileAdapter } from "./NeutralinoBackupFileAdapter";

interface DialogOptions {
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: Array<string> }>;
  multiSelections?: boolean;
}

class FakeOs {
  public savePath = "C:/backup/clock-rhythm-backup.json";
  public openPaths = ["C:/backup/clock-rhythm-backup.json"];
  public saveDialogOptions: DialogOptions | undefined;
  public openDialogOptions: DialogOptions | undefined;

  public async showSaveDialog(_title?: string, options?: DialogOptions): Promise<string> {
    this.saveDialogOptions = options;
    return this.savePath;
  }

  public async showOpenDialog(_title?: string, options?: DialogOptions): Promise<Array<string>> {
    this.openDialogOptions = options;
    return this.openPaths;
  }
}

class FakeFilesystem {
  public written = new Map<string, string>();
  public readCount = 0;
  public writeCount = 0;
  public readError: Error | null = null;
  public writeError: Error | null = null;

  public async writeFile(path: string, data: string): Promise<void> {
    this.writeCount += 1;
    if (this.writeError) {
      throw this.writeError;
    }
    this.written.set(path, data);
  }

  public async readFile(path: string): Promise<string> {
    this.readCount += 1;
    if (this.readError) {
      throw this.readError;
    }
    return this.written.get(path) ?? "";
  }
}

describe("NeutralinoBackupFileAdapter", () => {
  it("exports backup text through save dialog and writeFile", async () => {
    const os = new FakeOs();
    const filesystem = new FakeFilesystem();
    const adapter = new NeutralinoBackupFileAdapter(os, filesystem);

    await adapter.saveBackup("{\"schemaVersion\":1}");

    expect(filesystem.written.get("C:/backup/clock-rhythm-backup.json")).toBe("{\"schemaVersion\":1}");
    expect(os.saveDialogOptions).toMatchObject({
      defaultPath: "clock-rhythm-backup.json",
      filters: [{ extensions: ["json"], name: "JSON" }],
    });
  });

  it("imports backup text through open dialog and readFile", async () => {
    const os = new FakeOs();
    const filesystem = new FakeFilesystem();
    filesystem.written.set("C:/backup/clock-rhythm-backup.json", "{\"schemaVersion\":1}");
    const adapter = new NeutralinoBackupFileAdapter(os, filesystem);

    await expect(adapter.readBackup()).resolves.toBe("{\"schemaVersion\":1}");
    expect(os.openDialogOptions).toMatchObject({
      filters: [{ extensions: ["json"], name: "JSON" }],
      multiSelections: false,
    });
  });

  it("does not write a file when the user cancels the export dialog", async () => {
    const os = new FakeOs();
    os.savePath = "";
    const filesystem = new FakeFilesystem();
    const adapter = new NeutralinoBackupFileAdapter(os, filesystem);

    await adapter.saveBackup("{\"schemaVersion\":1}");

    expect(filesystem.writeCount).toBe(0);
  });

  it("returns null when the user cancels the import dialog", async () => {
    const os = new FakeOs();
    os.openPaths = [];
    const filesystem = new FakeFilesystem();
    const adapter = new NeutralinoBackupFileAdapter(os, filesystem);

    await expect(adapter.readBackup()).resolves.toBeNull();
    expect(filesystem.readCount).toBe(0);
  });

  it("propagates filesystem read and write failures", async () => {
    const os = new FakeOs();
    const filesystem = new FakeFilesystem();
    filesystem.writeError = new Error("write failed");
    filesystem.readError = new Error("read failed");
    const adapter = new NeutralinoBackupFileAdapter(os, filesystem);

    await expect(adapter.saveBackup("{\"schemaVersion\":1}")).rejects.toThrow("write failed");
    await expect(adapter.readBackup()).rejects.toThrow("read failed");
  });
});
