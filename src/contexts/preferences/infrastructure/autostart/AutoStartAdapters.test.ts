import { describe, expect, it } from "vitest";
import { LinuxAutoStartAdapter } from "./LinuxAutoStartAdapter";
import { MacOSAutoStartAdapter } from "./MacOSAutoStartAdapter";
import { WindowsAutoStartAdapter } from "./WindowsAutoStartAdapter";
import type { CommandExecutor } from "./CommandExecutor";

class FakeCommandExecutor implements CommandExecutor {
  public commands: string[] = [];

  public async execute(command: string): Promise<{ exitCode: number; stdOut: string; stdErr: string }> {
    this.commands.push(command);
    return { exitCode: 0, stdOut: "true", stdErr: "" };
  }
}

describe("AutoStartAdapters", () => {
  it("registers Windows startup through the startup folder shortcut", async () => {
    const executor = new FakeCommandExecutor();
    const adapter = new WindowsAutoStartAdapter(executor, {
      appName: "Clock Rhythm",
      executablePath: "C:/Apps/clock-rhythm.exe",
    });

    await adapter.enable();

    expect(executor.commands[0]).toContain("WScript.Shell");
    expect(executor.commands[0]).toContain("Startup");
    expect(executor.commands[0]).toContain("clock-rhythm.exe");
  });

  it("registers macOS startup through a LaunchAgent plist", async () => {
    const executor = new FakeCommandExecutor();
    const adapter = new MacOSAutoStartAdapter(executor, {
      appName: "Clock Rhythm",
      executablePath: "/Applications/Clock Rhythm.app/Contents/MacOS/clock-rhythm",
    });

    await adapter.enable();

    expect(executor.commands[0]).toContain("Library/LaunchAgents");
    expect(executor.commands[0]).toContain("app.clock.personal-time-manager.plist");
  });

  it("registers Linux startup through an autostart desktop entry", async () => {
    const executor = new FakeCommandExecutor();
    const adapter = new LinuxAutoStartAdapter(executor, {
      appName: "Clock Rhythm",
      executablePath: "/opt/clock-rhythm/clock-rhythm",
    });

    await adapter.enable();

    expect(executor.commands[0]).toContain(".config/autostart");
    expect(executor.commands[0]).toContain("clock-rhythm.desktop");
  });
});

