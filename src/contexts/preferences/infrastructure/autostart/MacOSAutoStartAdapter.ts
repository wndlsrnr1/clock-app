import type { AutoStartPort } from "../../application/ports/AutoStartPort";
import type { AutoStartConfiguration } from "./AutoStartConfiguration";
import type { CommandExecutor } from "./CommandExecutor";
import { quoteShell } from "./shellEscape";

export class MacOSAutoStartAdapter implements AutoStartPort {
  private readonly label = "app.clock.personal-time-manager";

  public constructor(
    private readonly commandExecutor: CommandExecutor,
    private readonly configuration: AutoStartConfiguration,
  ) {}

  public async enable(): Promise<void> {
    await this.commandExecutor.execute(this.createLaunchAgentCommand());
  }

  public async disable(): Promise<void> {
    const plistPath = this.plistPath();
    await this.commandExecutor.execute(`launchctl unload ${quoteShell(plistPath)} 2>/dev/null; rm -f ${quoteShell(plistPath)}`);
  }

  public async isEnabled(): Promise<boolean> {
    const result = await this.commandExecutor.execute(`test -f ${quoteShell(this.plistPath())} && echo true || echo false`);

    return result.stdOut.toLowerCase().includes("true");
  }

  private createLaunchAgentCommand(): string {
    const plistPath = this.plistPath();
    const plist = this.launchAgentPlist();

    return `mkdir -p "$HOME/Library/LaunchAgents" && printf %s ${quoteShell(plist)} > ${quoteShell(plistPath)} && launchctl load ${quoteShell(plistPath)} 2>/dev/null || true`;
  }

  private launchAgentPlist(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${this.label}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${this.configuration.executablePath}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>`;
  }

  private plistPath(): string {
    return `$HOME/Library/LaunchAgents/${this.label}.plist`;
  }
}

