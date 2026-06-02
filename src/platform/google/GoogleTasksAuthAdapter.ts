import { os } from "@neutralinojs/lib";
import { GoogleTasksCredentialRepository, type GoogleTasksCredential } from "./GoogleTasksCredentialRepository";
import { GoogleTasksSettingsRepository } from "./GoogleTasksSettingsRepository";

interface UrlOpenerPort {
  open(url: string): Promise<void> | void;
}

interface FetchPort {
  (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

export class GoogleTasksAuthAdapter {
  private readonly scope = "https://www.googleapis.com/auth/tasks";

  public constructor(
    private readonly settingsRepository: GoogleTasksSettingsRepository,
    private readonly credentialRepository: GoogleTasksCredentialRepository,
    private readonly opener: UrlOpenerPort = os,
    private readonly fetcher: FetchPort = fetch,
    private readonly cryptoPort: Crypto = crypto,
  ) {}

  public async beginAuthorization(): Promise<string> {
    const settings = await this.settingsRepository.get();

    if (!settings.clientId) {
      throw new Error("Google Client ID를 먼저 입력해주세요.");
    }

    const codeVerifier = this.randomToken(64);
    const state = this.randomToken(24);
    const redirectUri = this.redirectUri();
    const codeChallenge = await this.createCodeChallenge(codeVerifier);
    const authorizationUrl = this.authorizationUrl(settings.clientId, redirectUri, codeChallenge, state);

    await this.settingsRepository.savePendingAuthorization({ codeVerifier, redirectUri, state });
    await this.opener.open(authorizationUrl);

    return authorizationUrl;
  }

  public async completeAuthorization(codeOrUrl: string): Promise<GoogleTasksCredential> {
    const settings = await this.settingsRepository.get();
    const code = this.extractAuthorizationCode(codeOrUrl);

    if (!settings.clientId || !settings.pendingAuthorization) {
      throw new Error("Google 인증을 먼저 시작해주세요.");
    }

    const response = await this.fetcher("https://oauth2.googleapis.com/token", {
      body: new URLSearchParams({
        client_id: settings.clientId,
        code,
        code_verifier: settings.pendingAuthorization.codeVerifier,
        grant_type: "authorization_code",
        redirect_uri: settings.pendingAuthorization.redirectUri,
      }),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Google 인증 토큰을 발급받지 못했습니다.");
    }

    const token = await response.json() as GoogleTokenResponse;
    const credential: GoogleTasksCredential = {
      accessToken: token.access_token,
      expiresAt: Date.now() + token.expires_in * 1000,
      refreshToken: token.refresh_token ?? "",
      scope: token.scope ?? this.scope,
    };

    if (!credential.refreshToken) {
      throw new Error("Google refresh token이 응답에 없습니다. 인증을 다시 시도해주세요.");
    }

    await this.credentialRepository.save(credential);
    await this.settingsRepository.clearPendingAuthorization();

    return credential;
  }

  private authorizationUrl(clientId: string, redirectUri: string, codeChallenge: string, state: string): string {
    const params = new URLSearchParams({
      access_type: "offline",
      client_id: clientId,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "consent",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: this.scope,
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  private async createCodeChallenge(codeVerifier: string): Promise<string> {
    const digest = await this.cryptoPort.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
    return this.base64Url(new Uint8Array(digest));
  }

  private randomToken(byteLength: number): string {
    const bytes = this.cryptoPort.getRandomValues(new Uint8Array(byteLength));
    return this.base64Url(bytes);
  }

  private base64Url(bytes: Uint8Array): string {
    const binary = Array.from(bytes, (byte: number): string => String.fromCharCode(byte)).join("");

    return btoa(binary)
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "");
  }

  private redirectUri(): string {
    const port = globalThis.NL_PORT ?? window.location.port;

    return `http://127.0.0.1:${port}/google-oauth`;
  }

  private extractAuthorizationCode(codeOrUrl: string): string {
    const trimmedValue = codeOrUrl.trim();

    if (!trimmedValue.startsWith("http")) {
      return trimmedValue;
    }

    const parsedUrl = new URL(trimmedValue);
    const code = parsedUrl.searchParams.get("code");

    if (!code) {
      throw new Error("Google 인증 code를 찾을 수 없습니다.");
    }

    return code;
  }
}
