export interface BackupFilePort {
  saveBackup(text: string): Promise<void>;
  readBackup(): Promise<string | null>;
}

export interface BackupClock {
  now(): Date;
}
