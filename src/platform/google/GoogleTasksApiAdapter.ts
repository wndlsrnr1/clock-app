import { GoogleTasksCredentialRepository, type GoogleTasksCredential } from "./GoogleTasksCredentialRepository";
import type { GoogleTaskPayload, GoogleTaskResource } from "./GoogleTasksMapper";
import type { GoogleTasksApiPort } from "./GoogleTasksSyncAdapter";
import { GoogleTasksSettingsRepository } from "./GoogleTasksSettingsRepository";

interface FetchPort {
  (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface GoogleTaskListResource {
  id: string;
  title: string;
}

interface GoogleTaskListsResponse {
  items?: Array<GoogleTaskListResource>;
}

interface GoogleTasksResponse {
  items?: Array<GoogleTaskResource>;
}

interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  scope?: string;
}

export interface GoogleTaskListSnapshot {
  id: string;
  title: string;
}

export class GoogleTasksApiAdapter implements GoogleTasksApiPort {
  public constructor(
    private readonly settingsRepository: GoogleTasksSettingsRepository,
    private readonly credentialRepository: GoogleTasksCredentialRepository,
    private readonly fetcher: FetchPort = fetch,
  ) {}

  public async listTaskLists(): Promise<Array<GoogleTaskListSnapshot>> {
    const response = await this.request<GoogleTaskListsResponse>("https://tasks.googleapis.com/tasks/v1/users/@me/lists");

    return (response.items ?? []).map((taskList: GoogleTaskListResource): GoogleTaskListSnapshot => ({
      id: taskList.id,
      title: taskList.title,
    }));
  }

  public async listTasks(taskListId: string): Promise<Array<GoogleTaskResource>> {
    const params = new URLSearchParams({
      maxResults: "100",
      showCompleted: "true",
      showHidden: "true",
    });
    const response = await this.request<GoogleTasksResponse>(`https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks?${params.toString()}`);

    return response.items ?? [];
  }

  public async insertTask(taskListId: string, payload: GoogleTaskPayload): Promise<GoogleTaskResource> {
    return this.request<GoogleTaskResource>(`https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks`, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  }

  public async patchTask(taskListId: string, googleTaskId: string, payload: GoogleTaskPayload): Promise<GoogleTaskResource> {
    return this.request<GoogleTaskResource>(`https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(googleTaskId)}`, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
  }

  private async request<TResponse>(url: string, init: RequestInit = {}): Promise<TResponse> {
    const credential = await this.validCredential();
    const response = await this.fetcher(url, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${credential.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Google Tasks API 요청에 실패했습니다.");
    }

    return response.json() as Promise<TResponse>;
  }

  private async validCredential(): Promise<GoogleTasksCredential> {
    const credential = await this.credentialRepository.get();

    if (!credential) {
      throw new Error("Google Tasks 인증이 필요합니다.");
    }

    if (credential.expiresAt > Date.now() + 60_000) {
      return credential;
    }

    return this.refreshCredential(credential);
  }

  private async refreshCredential(credential: GoogleTasksCredential): Promise<GoogleTasksCredential> {
    const settings = await this.settingsRepository.get();
    const response = await this.fetcher("https://oauth2.googleapis.com/token", {
      body: new URLSearchParams({
        client_id: settings.clientId,
        grant_type: "refresh_token",
        refresh_token: credential.refreshToken,
      }),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Google Tasks 인증 갱신에 실패했습니다.");
    }

    const token = await response.json() as RefreshTokenResponse;
    const refreshedCredential: GoogleTasksCredential = {
      accessToken: token.access_token,
      expiresAt: Date.now() + token.expires_in * 1000,
      refreshToken: credential.refreshToken,
      scope: token.scope ?? credential.scope,
    };

    await this.credentialRepository.save(refreshedCredential);

    return refreshedCredential;
  }
}
