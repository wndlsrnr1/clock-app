import { describe, expect, it } from "vitest";
import { determineLayoutMode } from "./useLayoutMode";

describe("determineLayoutMode", () => {
  it("uses vertical compact mode when the available height is taller than width", () => {
    expect(determineLayoutMode({ height: 900, width: 760 })).toBe("verticalCompact");
    expect(determineLayoutMode({ height: 920, width: 680 })).toBe("verticalCompact");
  });

  it("uses wide focus mode for large containers that are not height constrained", () => {
    expect(determineLayoutMode({ height: 1400, width: 1400 })).toBe("wideFocus");
  });

  it("uses normal mode for ordinary landscape containers", () => {
    expect(determineLayoutMode({ height: 900, width: 1000 })).toBe("normal");
    expect(determineLayoutMode({ height: 680, width: 920 })).toBe("normal");
  });
});
