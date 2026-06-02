import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleTasksApiAdapter } from "./GoogleTasksApiAdapter";
import { GoogleTasksCredentialRepository } from "./GoogleTasksCredentialRepository";
import { GoogleTasksSettingsRepository } from "./GoogleTasksSettingsRepository";

class FakeStorage {
  private readonly values = new Map<string, string>();

  public async getData(key: string): Promise<string> {
    const value = this.values.get(key);

    if (value === undefined) {
      throw new Error("missing");
    }

    return value;
  }

  public async setData(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }
}

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

async function createAdapter(fetcher = vi.fn((): Promise<Response> => Promise.resolve(jsonResponse(200, { items: [] })))): Promise<{
  adapter: GoogleTasksApiAdapter;
  credentials: GoogleTasksCredentialRepository;
  fetcher: ReturnType<typeof vi.fn>;
  settings: GoogleTasksSettingsRepository;
}> {
  const storage = new FakeStorage();
  const settings = new GoogleTasksSettingsRepository(storage);
  const credentials = new GoogleTasksCredentialRepository(storage);
  await settings.saveClientId("desktop-client-id.apps.googleusercontent.com");

  return {
    adapter: new GoogleTasksApiAdapter(settings, credentials, fetcher),
    credentials,
    fetcher,
    settings,
  };
}

describe("GoogleTasksApiAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires Google Tasks credentials before calling the API", async () => {
    const { adapter, fetcher } = await createAdapter();

    await expect(adapter.listTaskLists()).rejects.toThrow("Google Tasks 인증이 필요합니다.");

    expect(fetcher).not.toHaveBeenCalled();
  });

  it("summarizes a Google Tasks API failure without exposing authorization data", async () => {
    const fetcher = vi.fn((): Promise<Response> => Promise.resolve(jsonResponse(403, {
      error: {
        code: 403,
        message: "Google Tasks API has not been used in project 123 before or it is disabled.",
        status: "PERMISSION_DENIED",
      },
    })));
    const { adapter, credentials } = await createAdapter(fetcher);
    await credentials.save({
      accessToken: "secret-access-token",
      expiresAt: Date.now() + 120_000,
      refreshToken: "secret-refresh-token",
      scope: "https://www.googleapis.com/auth/tasks",
    });

    await expect(adapter.listTaskLists())
      .rejects.toThrow("Google Tasks API 요청에 실패했습니다. (HTTP 403: PERMISSION_DENIED - Google Tasks API has not been used in project 123 before or it is disabled.)");
    await expect(adapter.listTaskLists()).rejects.not.toThrow("secret-access-token");
  });

  it("calls the browser fetch function with the browser global receiver", async () => {
    const storage = new FakeStorage();
    const settings = new GoogleTasksSettingsRepository(storage);
    const credentials = new GoogleTasksCredentialRepository(storage);
    let fetchWasCalledWithGlobalReceiver = false;
    vi.stubGlobal("fetch", function browserFetch(this: unknown): Promise<Response> {
      fetchWasCalledWithGlobalReceiver = Object.is(this, globalThis);

      return Promise.resolve(jsonResponse(200, { items: [] }));
    });
    await settings.saveClientId("desktop-client-id.apps.googleusercontent.com");
    await credentials.save({
      accessToken: "secret-access-token",
      expiresAt: Date.now() + 120_000,
      refreshToken: "secret-refresh-token",
      scope: "https://www.googleapis.com/auth/tasks",
    });

    const adapter = new GoogleTasksApiAdapter(settings, credentials);

    await adapter.listTaskLists();

    expect(fetchWasCalledWithGlobalReceiver).toBe(true);
  });

  it("summarizes a refresh failure without exposing the refresh token", async () => {
    const fetcher = vi.fn((): Promise<Response> => Promise.resolve(jsonResponse(400, {
      error: "invalid_grant",
      error_description: "Token has been expired or revoked.",
    })));
    const { adapter, credentials } = await createAdapter(fetcher);
    await credentials.save({
      accessToken: "old-access-token",
      expiresAt: Date.now() - 1,
      refreshToken: "secret-refresh-token",
      scope: "https://www.googleapis.com/auth/tasks",
    });

    await expect(adapter.listTaskLists())
      .rejects.toThrow("Google Tasks 인증 갱신에 실패했습니다. (HTTP 400: invalid_grant - Token has been expired or revoked.)");
    await expect(adapter.listTaskLists()).rejects.not.toThrow("secret-refresh-token");
  });

  it("includes the saved OAuth client secret when refreshing an access token", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(jsonResponse(200, {
        access_token: "new-access-token",
        expires_in: 3600,
      }))
      .mockResolvedValueOnce(jsonResponse(200, { items: [] }));
    const { adapter, credentials, settings } = await createAdapter(fetcher);
    await settings.saveOAuthClient({
      clientId: "desktop-client-id.apps.googleusercontent.com",
      clientSecret: "desktop-client-secret",
    });
    await credentials.save({
      accessToken: "old-access-token",
      expiresAt: Date.now() - 1,
      refreshToken: "secret-refresh-token",
      scope: "https://www.googleapis.com/auth/tasks",
    });

    await adapter.listTaskLists();

    expect(String(fetcher.mock.calls[0]?.[1]?.body)).toContain("client_secret=desktop-client-secret");
  });

  it("deletes a Google task with an authenticated DELETE request", async () => {
    const fetcher = vi.fn((): Promise<Response> => Promise.resolve(new Response(null, { status: 204 })));
    const { adapter, credentials } = await createAdapter(fetcher);
    await credentials.save({
      accessToken: "secret-access-token",
      expiresAt: Date.now() + 120_000,
      refreshToken: "secret-refresh-token",
      scope: "https://www.googleapis.com/auth/tasks",
    });

    await adapter.deleteTask("task-list-1", "google-task-1");

    expect(fetcher).toHaveBeenCalledWith(
      "https://tasks.googleapis.com/tasks/v1/lists/task-list-1/tasks/google-task-1",
      {
        headers: { Authorization: "Bearer secret-access-token" },
        method: "DELETE",
      },
    );
  });

  it("treats 404 as a successful Google task delete", async () => {
    const fetcher = vi.fn((): Promise<Response> => Promise.resolve(jsonResponse(404, {
      error: {
        code: 404,
        message: "Task not found.",
        status: "NOT_FOUND",
      },
    })));
    const { adapter, credentials } = await createAdapter(fetcher);
    await credentials.save({
      accessToken: "secret-access-token",
      expiresAt: Date.now() + 120_000,
      refreshToken: "secret-refresh-token",
      scope: "https://www.googleapis.com/auth/tasks",
    });

    await expect(adapter.deleteTask("task-list-1", "already-deleted")).resolves.toBeUndefined();
  });
});
