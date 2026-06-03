import { describe, expect, it, vi } from "vitest";
import { BrowserPreviewBackupFileAdapter } from "./BrowserPreviewBackupFileAdapter";

class FakeJsonFilePicker {
  public file: File | null = null;

  public async chooseJson(): Promise<File | null> {
    return this.file;
  }
}

describe("BrowserPreviewBackupFileAdapter", () => {
  it("downloads exported backup JSON through a blob URL", async () => {
    const picker = new FakeJsonFilePicker();
    const clicked = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation((): void => {});
    const revokedUrls: Array<string> = [];
    const blobs: Array<Blob> = [];
    const adapter = new BrowserPreviewBackupFileAdapter(
      picker,
      (blob: Blob): string => {
        blobs.push(blob);
        return "blob:clock-rhythm-backup";
      },
      (url: string): void => {
        revokedUrls.push(url);
      },
    );

    await adapter.saveBackup("{\"schemaVersion\":1}");

    const downloadAnchor = document.querySelector<HTMLAnchorElement>("a[download='clock-rhythm-backup.json']");
    expect(clicked).toHaveBeenCalledTimes(1);
    expect(blobs[0]?.type).toBe("application/json");
    expect(downloadAnchor).not.toBeInTheDocument();
    expect(revokedUrls).toEqual(["blob:clock-rhythm-backup"]);
    clicked.mockRestore();
  });

  it("reads selected JSON backup file text", async () => {
    const picker = new FakeJsonFilePicker();
    picker.file = new File(["{\"schemaVersion\":1}"], "backup.json", { type: "application/json" });
    const adapter = new BrowserPreviewBackupFileAdapter(picker);

    await expect(adapter.readBackup()).resolves.toBe("{\"schemaVersion\":1}");
  });

  it("returns null when the import file picker is cancelled", async () => {
    const adapter = new BrowserPreviewBackupFileAdapter(new FakeJsonFilePicker());

    await expect(adapter.readBackup()).resolves.toBeNull();
  });
});
