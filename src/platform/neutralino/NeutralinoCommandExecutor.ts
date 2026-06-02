import { os } from "@neutralinojs/lib";
import type { CommandExecutor, CommandResult } from "../autostart/CommandExecutor";

export class NeutralinoCommandExecutor implements CommandExecutor {
  public async execute(command: string): Promise<CommandResult> {
    return os.execCommand(command);
  }
}

