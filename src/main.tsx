import { init } from "@neutralinojs/lib";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { composeApplication } from "./bootstrap/composeApplication";
import { composeBrowserPreviewApplication } from "./bootstrap/composeBrowserPreviewApplication";
import { RhythmApp } from "./ui/RhythmApp";
import "./ui/styles.css";
import { isNeutralinoRuntime } from "./platform/neutralino/NeutralinoRuntimeGlobals";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element was not found.");
}

void renderApplication(rootElement);

async function renderApplication(rootElement: HTMLElement): Promise<void> {
  const application = await composeRuntimeApplication();

  createRoot(rootElement).render(
    <StrictMode>
      <RhythmApp services={application.services} />
    </StrictMode>,
  );
}

async function composeRuntimeApplication(): Promise<{ services: Parameters<typeof RhythmApp>[0]["services"] }> {
  if (!isNeutralinoRuntime()) {
    return composeBrowserPreviewApplication();
  }

  init();
  return composeApplication();
}
