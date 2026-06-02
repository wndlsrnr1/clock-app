import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleTasksAuthAdapter } from "./GoogleTasksAuthAdapter";
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

function tokenResponse(): Response {
  return new Response(JSON.stringify({
    access_token: "access-token",
    expires_in: 3600,
    refresh_token: "refresh-token",
  }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

async function createAdapter(): Promise<{
  adapter: GoogleTasksAuthAdapter;
  credentials: GoogleTasksCredentialRepository;
  fetcher: ReturnType<typeof vi.fn>;
}> {
  const storage = new FakeStorage();
  const settings = new GoogleTasksSettingsRepository(storage);
  const credentials = new GoogleTasksCredentialRepository(storage);
  await settings.saveClientId("client-id");
  await settings.savePendingAuthorization({
    codeVerifier: "code-verifier",
    redirectUri: "http://127.0.0.1:5174/google-oauth",
    state: "expected-state",
  });
  const fetcher = vi.fn((): Promise<Response> => Promise.resolve(tokenResponse()));

  return {
    adapter: new GoogleTasksAuthAdapter(settings, credentials, { open: vi.fn() }, fetcher),
    credentials,
    fetcher,
  };
}

describe("GoogleTasksAuthAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exchanges a redirect URL only when the OAuth state matches", async () => {
    const { adapter, credentials, fetcher } = await createAdapter();

    await adapter.completeAuthorization("http://127.0.0.1:5174/google-oauth?code=code-ok&state=expected-state");

    expect(fetcher).toHaveBeenCalledOnce();
    expect(String(fetcher.mock.calls[0]?.[1]?.body)).toContain("code=code-ok");
    expect(await credentials.get()).toMatchObject({ accessToken: "access-token", refreshToken: "refresh-token" });
  });

  it("rejects a redirect URL when the OAuth state does not match", async () => {
    const { adapter, fetcher } = await createAdapter();

    await expect(adapter.completeAuthorization("http://127.0.0.1:5174/google-oauth?code=code-ok&state=wrong-state"))
      .rejects.toThrow("Google 인증 state가 일치하지 않습니다.");

    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects a redirect URL that does not match the pending redirect URI", async () => {
    const { adapter, fetcher } = await createAdapter();

    await expect(adapter.completeAuthorization("http://127.0.0.1:5174/not-google-oauth?code=code-ok&state=expected-state"))
      .rejects.toThrow("Google 인증 redirect URL이 일치하지 않습니다.");

    expect(fetcher).not.toHaveBeenCalled();
  });

  it("keeps accepting a raw authorization code for manual fallback", async () => {
    const { adapter, fetcher } = await createAdapter();

    await adapter.completeAuthorization("raw-code");

    expect(fetcher).toHaveBeenCalledOnce();
    expect(String(fetcher.mock.calls[0]?.[1]?.body)).toContain("code=raw-code");
  });

  it("includes the saved OAuth client secret when exchanging an authorization code", async () => {
    const storage = new FakeStorage();
    const settings = new GoogleTasksSettingsRepository(storage);
    const credentials = new GoogleTasksCredentialRepository(storage);
    const fetcher = vi.fn<typeof fetch>((): Promise<Response> => Promise.resolve(tokenResponse()));
    await settings.saveOAuthClient({
      clientId: "client-id",
      clientSecret: "client-secret",
    });
    await settings.savePendingAuthorization({
      codeVerifier: "code-verifier",
      redirectUri: "http://127.0.0.1:5174/google-oauth",
      state: "expected-state",
    });

    const adapter = new GoogleTasksAuthAdapter(settings, credentials, { open: vi.fn() }, fetcher);

    await adapter.completeAuthorization("raw-code");

    const requestInit = fetcher.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(String(requestInit?.body)).toContain("client_secret=client-secret");
  });

  it("calls the browser fetch function with the browser global receiver", async () => {
    const storage = new FakeStorage();
    const settings = new GoogleTasksSettingsRepository(storage);
    const credentials = new GoogleTasksCredentialRepository(storage);
    let fetchWasCalledWithGlobalReceiver = false;
    vi.stubGlobal("fetch", function browserFetch(this: unknown): Promise<Response> {
      fetchWasCalledWithGlobalReceiver = Object.is(this, globalThis);

      return Promise.resolve(tokenResponse());
    });
    await settings.saveClientId("client-id");
    await settings.savePendingAuthorization({
      codeVerifier: "code-verifier",
      redirectUri: "http://127.0.0.1:5174/google-oauth",
      state: "expected-state",
    });

    const adapter = new GoogleTasksAuthAdapter(settings, credentials, { open: vi.fn() });

    await adapter.completeAuthorization("http://127.0.0.1:5174/google-oauth?code=code-ok&state=expected-state");

    expect(fetchWasCalledWithGlobalReceiver).toBe(true);
  });

  it("summarizes a token exchange failure without exposing the authorization code", async () => {
    const { adapter, fetcher } = await createAdapter();
    fetcher.mockImplementation((): Promise<Response> => Promise.resolve(new Response(JSON.stringify({
      error: "invalid_grant",
      error_description: "Malformed authorization code.",
    }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    })));

    await expect(adapter.completeAuthorization("raw-secret-code"))
      .rejects.toThrow("Google 인증 토큰을 발급받지 못했습니다. (HTTP 400: invalid_grant - Malformed authorization code.)");

    const error = await adapter.completeAuthorization("raw-secret-code")
      .then((): Error => new Error("expected failure"))
      .catch((caught: unknown): Error => caught as Error);

    expect(error.message).not.toContain("raw-secret-code");
  });
});
