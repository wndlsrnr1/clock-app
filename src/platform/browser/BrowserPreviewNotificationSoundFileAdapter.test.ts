import { describe, expect, it } from "vitest";
import { BrowserPreviewNotificationSoundFileAdapter } from "./BrowserPreviewNotificationSoundFileAdapter";

class FakeBrowserFilePicker {
  public constructor(private readonly file: File | null) {}

  public async chooseMp3(): Promise<File | null> {
    return this.file;
  }
}

describe("BrowserPreviewNotificationSoundFileAdapter", () => {
  it("returns null when the user cancels file selection", async () => {
    const adapter = new BrowserPreviewNotificationSoundFileAdapter(new FakeBrowserFilePicker(null));

    await expect(adapter.chooseCustomMp3()).resolves.toBeNull();
  });

  it("returns a browser object URL for a selected mp3 file", async () => {
    const adapter = new BrowserPreviewNotificationSoundFileAdapter(
      new FakeBrowserFilePicker(new File(["sound"], "bell.mp3", { type: "audio/mpeg" })),
      (file: File): string => `blob:preview/${file.name}`,
    );

    await expect(adapter.chooseCustomMp3()).resolves.toEqual({
      fileName: "bell.mp3",
      source: "blob:preview/bell.mp3",
    });
  });

  it("rejects files that are not mp3 files", async () => {
    const adapter = new BrowserPreviewNotificationSoundFileAdapter(
      new FakeBrowserFilePicker(new File(["sound"], "bell.wav", { type: "audio/wav" })),
    );

    await expect(adapter.chooseCustomMp3()).rejects.toThrow("20MB 이하의 mp3 파일만 알림음으로 사용할 수 있습니다.");
  });
});
