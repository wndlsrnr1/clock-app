import { storage } from "@neutralinojs/lib";
import type { NeutralinoStoragePort } from "../neutralino/NeutralinoSettingsRepository";
import type { GoogleTasksSettingsPort } from "./GoogleTasksSyncAdapter";

export interface PendingGoogleAuthorization {
  codeVerifier: string;
  redirectUri: string;
  state: string;
}

export interface GoogleTasksSettings {
  clientId: string;
  taskListId: string | null;
  pendingAuthorization: PendingGoogleAuthorization | null;
}

export class GoogleTasksSettingsRepository implements GoogleTasksSettingsPort {
  private readonly key = "google-tasks-settings";

  public constructor(private readonly neutralinoStorage: NeutralinoStoragePort = storage) {}

  public async get(): Promise<GoogleTasksSettings> {
    try {
      return GoogleTasksSettingsRepository.restore(JSON.parse(await this.neutralinoStorage.getData(this.key)) as Partial<GoogleTasksSettings>);
    } catch {
      return GoogleTasksSettingsRepository.default();
    }
  }

  public async getTaskListId(): Promise<string | null> {
    return (await this.get()).taskListId;
  }

  public async saveClientId(clientId: string): Promise<GoogleTasksSettings> {
    const settings = {
      ...(await this.get()),
      clientId: clientId.trim(),
    };
    await this.save(settings);

    return settings;
  }

  public async selectTaskList(taskListId: string): Promise<GoogleTasksSettings> {
    const settings = {
      ...(await this.get()),
      taskListId,
    };
    await this.save(settings);

    return settings;
  }

  public async savePendingAuthorization(pendingAuthorization: PendingGoogleAuthorization): Promise<void> {
    await this.save({
      ...(await this.get()),
      pendingAuthorization,
    });
  }

  public async clearPendingAuthorization(): Promise<void> {
    await this.save({
      ...(await this.get()),
      pendingAuthorization: null,
    });
  }

  private async save(settings: GoogleTasksSettings): Promise<void> {
    await this.neutralinoStorage.setData(this.key, JSON.stringify(settings));
  }

  private static default(): GoogleTasksSettings {
    return {
      clientId: "",
      pendingAuthorization: null,
      taskListId: null,
    };
  }

  private static restore(settings: Partial<GoogleTasksSettings>): GoogleTasksSettings {
    return {
      clientId: settings.clientId ?? "",
      pendingAuthorization: settings.pendingAuthorization ?? null,
      taskListId: settings.taskListId ?? null,
    };
  }
}
