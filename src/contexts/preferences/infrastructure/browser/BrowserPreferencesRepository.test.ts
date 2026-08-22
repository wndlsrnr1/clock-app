import { beforeEach, describe, expect, it } from "vitest";
import { UserPreferences } from "../../public";
import { BrowserPreferencesRepository } from "./BrowserPreferencesRepository";

describe("BrowserPreferencesRepository", (): void => {
  beforeEach((): void => localStorage.clear());

  it("round-trips the preference snapshot through the preview storage key", async (): Promise<void> => {
    const preferences = UserPreferences.default().changeLanguage("en").changeTheme("nord");
    const repository = new BrowserPreferencesRepository(localStorage);

    await repository.save(preferences);

    expect((await repository.get()).snapshot()).toEqual(preferences.snapshot());
    expect(localStorage.getItem("clock-rhythm-preview-preferences")).toContain("nord");
  });

  it("returns defaults for missing or malformed preview data", async (): Promise<void> => {
    const repository = new BrowserPreferencesRepository(localStorage);
    await expect(repository.get()).resolves.toEqual(UserPreferences.default());

    localStorage.setItem("clock-rhythm-preview-preferences", "not json");

    await expect(repository.get()).resolves.toEqual(UserPreferences.default());
  });
});
