import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAppNavigation } from "./useAppNavigation";

describe("useAppNavigation", (): void => {
  it("owns the current application page independently from Todo state", (): void => {
    const { result } = renderHook(() => useAppNavigation());

    act((): void => result.current.show("theme"));

    expect(result.current.page).toBe("theme");
  });
});
