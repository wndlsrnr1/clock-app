import { describe, expect, it } from "vitest";
import { GetRhythmStatusUseCase, RhythmSession } from "../contexts/rhythm/public";
import { AddTodoUseCase, TodoItem } from "../contexts/todo/public";
import { UpdatePreferencesUseCase, UserPreferences } from "../contexts/preferences/public";
import { ExportBackupUseCase } from "../features/data-transfer/public";

describe("module public surfaces", (): void => {
  it("exposes only the application and model entry points needed by consumers", (): void => {
    expect(GetRhythmStatusUseCase).toBeTypeOf("function");
    expect(RhythmSession).toBeTypeOf("function");
    expect(AddTodoUseCase).toBeTypeOf("function");
    expect(TodoItem).toBeTypeOf("function");
    expect(UpdatePreferencesUseCase).toBeTypeOf("function");
    expect(UserPreferences).toBeTypeOf("function");
    expect(ExportBackupUseCase).toBeTypeOf("function");
  });
});
