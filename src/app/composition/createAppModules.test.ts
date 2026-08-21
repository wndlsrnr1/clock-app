import { describe, expect, it, vi } from "vitest";
import type { RhythmAppServices } from "../../ui/RhythmAppServices";
import { createAppModules } from "./createAppModules";

describe("createAppModules", (): void => {
  it("groups the legacy flat services by owning module", (): void => {
    const startRhythm = { execute: vi.fn() };
    const updatePreferences = { execute: vi.fn() };
    const addTodo = { execute: vi.fn() };
    const exportBackup = { execute: vi.fn() };
    const services = {
      startRhythm,
      updatePreferences,
      addTodo,
      exportBackup,
    } as unknown as RhythmAppServices;

    const modules = createAppModules(services);

    expect(modules.rhythm.start).toBe(startRhythm);
    expect(modules.preferences.update).toBe(updatePreferences);
    expect(modules.todo.add).toBe(addTodo);
    expect(modules.dataTransfer.exportBackup).toBe(exportBackup);
  });
});
