import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface NeutralinoWindowModeConfig {
  injectClientLibrary?: boolean;
  injectGlobals?: boolean;
}

interface NeutralinoRuntimeConfig {
  modes: {
    window: NeutralinoWindowModeConfig;
  };
}

function readNeutralinoConfig(): NeutralinoRuntimeConfig {
  return JSON.parse(readFileSync(resolve(process.cwd(), "neutralino.config.json"), "utf8")) as NeutralinoRuntimeConfig;
}

function readIndexHtml(): string {
  return readFileSync(resolve(process.cwd(), "index.html"), "utf8");
}

describe("Neutralino runtime configuration", () => {
  it("uses @neutralinojs/lib without injecting a duplicate client library", () => {
    const config = readNeutralinoConfig();

    expect(config.modes.window.injectGlobals).toBe(true);
    expect(config.modes.window.injectClientLibrary).toBe(false);
  });

  it("does not load globals manually when the WebView injects globals", () => {
    const html = readIndexHtml();

    expect(html).not.toContain("__neutralino_globals.js");
  });
});
