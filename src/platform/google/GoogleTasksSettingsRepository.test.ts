import { describe, expect, it } from "vitest";
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

describe("GoogleTasksSettingsRepository", () => {
  it("saves and restores the user-provided OAuth client secret with the client ID", async () => {
    const storage = new FakeStorage();
    const repository = new GoogleTasksSettingsRepository(storage);

    await repository.saveOAuthClient({
      clientId: " desktop-client-id.apps.googleusercontent.com ",
      clientSecret: " desktop-client-secret ",
    });

    const restored = await new GoogleTasksSettingsRepository(storage).get();

    expect(restored.clientId).toBe("desktop-client-id.apps.googleusercontent.com");
    expect(restored.clientSecret).toBe("desktop-client-secret");
  });

  it("restores old settings without a client secret as an empty secret", async () => {
    const storage = new FakeStorage();
    await storage.setData("google-tasks-settings", JSON.stringify({
      clientId: "desktop-client-id.apps.googleusercontent.com",
      pendingAuthorization: null,
      taskListId: null,
    }));

    const restored = await new GoogleTasksSettingsRepository(storage).get();

    expect(restored.clientSecret).toBe("");
  });
});
