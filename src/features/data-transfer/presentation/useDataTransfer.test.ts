import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DataTransferModule } from "../public";
import { createTranslator } from "../../../shared/i18n/catalog";
import { useDataTransfer } from "./useDataTransfer";

describe("useDataTransfer", (): void => {
  it("owns export feedback independently from Todo state", async (): Promise<void> => {
    const execute = vi.fn<() => Promise<void>>(() => Promise.resolve());
    const module = { exportBackup: { execute } } as unknown as DataTransferModule;
    const { result } = renderHook(() => useDataTransfer(module, createTranslator("kor"), async () => undefined));

    await act(async (): Promise<void> => result.current.exportBackup());

    expect(execute).toHaveBeenCalledOnce();
    expect(result.current.message).toBe("백업 파일을 내보냈습니다.");
  });
});
