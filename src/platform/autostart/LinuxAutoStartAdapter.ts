import type { AutoStartPort } from "../../contexts/preferences/application/ports/AutoStartPort";
import type { AutoStartConfiguration } from "./AutoStartConfiguration";
import type { CommandExecutor } from "./CommandExecutor";
import { quoteShell } from "./shellEscape";

export class LinuxAutoStartAdapter implements AutoStartPort {
  public constructor(
    private readonly commandExecutor: CommandExecutor,
    private readonly configuration: AutoStartConfiguration,
  ) {}

  public async enable(): Promise<void> {
    await this.commandExecutor.execute(this.createDesktopEntryCommand());
  }

  public async disable(): Promise<void> {
    await this.commandExecutor.execute(`rm -f ${quoteShell(this.desktopEntryPath())}`);
  }

  public async isEnabled(): Promise<boolean> {
    const result = await this.commandExecutor.execute(`test -f ${quoteShell(this.desktopEntryPath())} && echo true || echo false`);

    return result.stdOut.toLowerCase().includes("true");
  }

  private createDesktopEntryCommand(): string {
    const desktopEntry = `[Desktop Entry]
Type=Application
Name=${this.configuration.appName}
Exec=${this.configuration.executablePath}
Terminal=false
X-GNOME-Autostart-enabled=true`;

    return `mkdir -p "$HOME/.config/autostart" && printf %s ${quoteShell(desktopEntry)} > ${quoteShell(this.desktopEntryPath())}`;
  }

  private desktopEntryPath(): string {
    return "$HOME/.config/autostart/clock-rhythm.desktop";
  }
}

