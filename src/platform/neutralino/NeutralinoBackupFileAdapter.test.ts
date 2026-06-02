import { describe, expect, it, vi } from "vitest";
import { NeutralinoBackupFileAdapter } from "./NeutralinoBackupFileAdapter";

class FakeOs {
  public async showSaveDialog(): Promise<string> {
    return "C:/backup/clock-rhythm-backup.json";
  }

  public async showOpenDialog(): Promise<Array<string>> {
    return ["C:/backup/clock-rhythm-backup.json"];
  }
}

class FakeFilesystem {
  public written = new Map<string, string>();

  public async writeFile(path: string, data: string): Promise<void> {
    this.written.set(path, data);
  }

  public async readFile(path: string): Promise<string> {
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
  });

  it("imports backup text through open dialog and readFile", async () => {
    const os = new FakeOs();
    const filesystem = new FakeFilesystem();
    filesystem.written.set("C:/backup/clock-rhythm-backup.json", "{\"schemaVersion\":1}");
    const adapter = new NeutralinoBackupFileAdapter(os, filesystem);

    await expect(adapter.readBackup()).resolves.toBe("{\"schemaVersion\":1}");
  });

  it("returns null when the user cancels the import dialog", async () => {
    const os = {
      showSaveDialog: vi.fn(),
      showOpenDialog: vi.fn(() => Promise.resolve([])),
    };
    const filesystem = new FakeFilesystem();
    const adapter = new NeutralinoBackupFileAdapter(os, filesystem);

    await expect(adapter.readBackup()).resolves.toBeNull();
  });
});
