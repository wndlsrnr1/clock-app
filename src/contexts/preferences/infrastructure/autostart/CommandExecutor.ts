export interface CommandResult {
  exitCode: number;
  stdOut: string;
  stdErr: string;
}

export interface CommandExecutor {
  execute(command: string): Promise<CommandResult>;
}

