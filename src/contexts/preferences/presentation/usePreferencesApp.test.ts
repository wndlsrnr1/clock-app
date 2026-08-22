import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PreferencesModule } from "../public";
import { UserPreferences } from "../public";
import { usePreferencesApp } from "./usePreferencesApp";

describe("usePreferencesApp", (): void => {
  it("owns theme changes without invoking unrelated preference actions", async (): Promise<void> => {
    const changeTheme = vi.fn(async (theme: UserPreferences["theme"]): Promise<UserPreferences> => (
      UserPreferences.default().changeTheme(theme)
    ));
    const modules = {
      changeTheme: { execute: changeTheme },
    } as unknown as PreferencesModule;
    const { result } = renderHook(() => usePreferencesApp(modules, UserPreferences.default().snapshot()));

    await act(async (): Promise<void> => result.current.changeTheme("nord"));

    expect(changeTheme).toHaveBeenCalledWith("nord");
    expect(result.current.preferences.theme).toBe("nord");
  });
});
