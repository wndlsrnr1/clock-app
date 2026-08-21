import type { AutoStartPort } from "../../contexts/preferences/application/ports/AutoStartPort";
import type { AutoStartConfiguration } from "./AutoStartConfiguration";
import type { CommandExecutor } from "./CommandExecutor";
import { quotePowerShell } from "./shellEscape";

export class WindowsAutoStartAdapter implements AutoStartPort {
  public constructor(
    private readonly commandExecutor: CommandExecutor,
    private readonly configuration: AutoStartConfiguration,
  ) {}

  public async enable(): Promise<void> {
    await this.commandExecutor.execute(this.createShortcutCommand());
  }

  public async disable(): Promise<void> {
    await this.commandExecutor.execute(`${this.powerShellPrefix()} "$startup = [Environment]::GetFolderPath('Startup'); $path = Join-Path $startup ${quotePowerShell(this.shortcutName())}; Remove-Item -LiteralPath $path -ErrorAction SilentlyContinue"`);
  }

  public async isEnabled(): Promise<boolean> {
    const result = await this.commandExecutor.execute(`${this.powerShellPrefix()} "$startup = [Environment]::GetFolderPath('Startup'); $path = Join-Path $startup ${quotePowerShell(this.shortcutName())}; Test-Path -LiteralPath $path"`);

    return result.stdOut.toLowerCase().includes("true");
  }

  private createShortcutCommand(): string {
    const targetPath = quotePowerShell(this.configuration.executablePath);
    return [
      `${this.powerShellPrefix()}`,
      "\"$shell = New-Object -ComObject WScript.Shell;",
      "$startup = [Environment]::GetFolderPath('Startup');",
      `$shortcut = $shell.CreateShortcut((Join-Path $startup ${quotePowerShell(this.shortcutName())}));`,
      `$shortcut.TargetPath = ${targetPath};`,
      "$shortcut.Save()\"",
    ].join(" ");
  }

  private shortcutName(): string {
    return `${this.configuration.appName}.lnk`;
  }

  private powerShellPrefix(): string {
    return "powershell -NoProfile -ExecutionPolicy Bypass -Command";
  }
}
