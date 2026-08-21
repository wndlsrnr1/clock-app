import { describe, expect, it } from "vitest";
import { UserPreferences } from "../../domain/UserPreferences";
import { GetPreferencesUseCase } from "./GetPreferencesUseCase";

describe("GetPreferencesUseCase", (): void => {
  it("returns the persisted preferences snapshot", async (): Promise<void> => {
    const preferences = UserPreferences.default().changeTheme("nord");
    const useCase = new GetPreferencesUseCase({
      get: async () => preferences,
      save: async () => undefined,
    });

    expect((await useCase.execute()).theme).toBe("nord");
  });
});
