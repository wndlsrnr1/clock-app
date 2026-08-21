import { init } from "@neutralinojs/lib";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { composeApplication } from "./bootstrap/composeApplication";
import { composeBrowserPreviewApplication } from "./bootstrap/composeBrowserPreviewApplication";
import { ClockRhythmApp } from "./app/ClockRhythmApp";
import "./ui/styles.css";
import { isNeutralinoRuntime } from "./platform/neutralino/NeutralinoRuntimeGlobals";
import { createAppModules } from "./app/composition/createAppModules";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element was not found.");
}

void renderApplication(rootElement);

async function renderApplication(rootElement: HTMLElement): Promise<void> {
  const application = await composeRuntimeApplication();
  const modules = createAppModules(application.services);

  createRoot(rootElement).render(
    <StrictMode>
      <ClockRhythmApp initialPreferences={application.initialPreferences} modules={modules} />
    </StrictMode>,
  );
}

async function composeRuntimeApplication(): Promise<Awaited<ReturnType<typeof composeApplication>>> {
  if (!isNeutralinoRuntime()) {
    return composeBrowserPreviewApplication();
  }

  init();
  return composeApplication();
}
