import { storage } from "@neutralinojs/lib";
import type { NeutralinoStoragePort } from "../neutralino/NeutralinoSettingsRepository";

export interface GoogleTasksCredential {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
}

export class GoogleTasksCredentialRepository {
  private readonly key = "google-tasks-credential";

  public constructor(private readonly neutralinoStorage: NeutralinoStoragePort = storage) {}

  public async get(): Promise<GoogleTasksCredential | null> {
    try {
      const credential = JSON.parse(await this.neutralinoStorage.getData(this.key)) as Partial<GoogleTasksCredential>;

      if (!credential.accessToken || !credential.refreshToken || !credential.expiresAt) {
        return null;
      }

      return {
        accessToken: credential.accessToken,
        expiresAt: credential.expiresAt,
        refreshToken: credential.refreshToken,
        scope: credential.scope ?? "",
      };
    } catch {
      return null;
    }
  }

  public async save(credential: GoogleTasksCredential): Promise<void> {
    await this.neutralinoStorage.setData(this.key, JSON.stringify(credential));
  }
}
