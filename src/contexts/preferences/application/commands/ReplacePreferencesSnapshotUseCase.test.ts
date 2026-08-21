import { describe, expect, it, vi } from "vitest";
import { UserPreferences } from "../../domain/UserPreferences";
import { ReplacePreferencesSnapshotUseCase } from "./ReplacePreferencesSnapshotUseCase";

describe("ReplacePreferencesSnapshotUseCase", (): void => {
  it("restores, saves, and publishes imported preferences", async (): Promise<void> => {
    const save = vi.fn<(preferences: UserPreferences) => Promise<void>>(() => Promise.resolve());
    const notify = vi.fn<(preferences: UserPreferences) => void>();
    const snapshot = UserPreferences.default().changeTerms(45, 15).snapshot();
    const useCase = new ReplacePreferencesSnapshotUseCase(
      { get: async () => UserPreferences.default(), save },
      { notify },
    );

    await useCase.execute(snapshot);

    const savedPreferences = save.mock.calls[0]?.[0];
    expect(savedPreferences).toBeInstanceOf(UserPreferences);
    expect(savedPreferences?.snapshot()).toEqual(snapshot);
    expect(notify).toHaveBeenCalledWith(savedPreferences);
  });
});
