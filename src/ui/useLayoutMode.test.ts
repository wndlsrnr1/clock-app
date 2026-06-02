import { describe, expect, it } from "vitest";
import { determineLayoutMode } from "./useLayoutMode";

describe("determineLayoutMode", () => {
  it("uses vertical compact mode when the available height is shorter than width", () => {
    expect(determineLayoutMode({ height: 700, width: 900 })).toBe("verticalCompact");
  });

  it("uses wide focus mode for large containers that are not height constrained", () => {
    expect(determineLayoutMode({ height: 1400, width: 1400 })).toBe("wideFocus");
  });

  it("uses normal mode for ordinary portrait-leaning containers", () => {
    expect(determineLayoutMode({ height: 900, width: 760 })).toBe("normal");
  });
});
