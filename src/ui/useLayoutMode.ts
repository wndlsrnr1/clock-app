import { useEffect, useState, type RefCallback } from "react";

export type LayoutMode = "normal" | "verticalCompact" | "wideFocus";

interface LayoutSize {
  width: number;
  height: number;
}

export function determineLayoutMode(size: LayoutSize): LayoutMode {
  if (size.height > size.width) {
    return "verticalCompact";
  }

  if (size.width >= 1280 && size.height >= 900) {
    return "wideFocus";
  }

  return "normal";
}

export function useLayoutMode(): { layoutMode: LayoutMode; containerRef: RefCallback<HTMLElement> } {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("normal");

  useEffect((): (() => void) | void => {
    if (!container || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries: Array<ResizeObserverEntry>): void => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      setLayoutMode(determineLayoutMode({
        height: entry.contentRect.height,
        width: entry.contentRect.width,
      }));
    });

    observer.observe(container);

    return (): void => observer.disconnect();
  }, [container]);

  return {
    containerRef: setContainer,
    layoutMode,
  };
}
