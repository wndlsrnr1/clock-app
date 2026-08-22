import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClockRhythmApp } from "./app/ClockRhythmApp";
import { composeRuntimeApplication } from "./app/composition/composeRuntimeApplication";
import "./app/styles/index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element was not found.");
}

void renderApplication(rootElement);

async function renderApplication(rootElement: HTMLElement): Promise<void> {
  const application = await composeRuntimeApplication();

  createRoot(rootElement).render(
    <StrictMode>
      <ClockRhythmApp
        initialNow={application.initialNow}
        initialPreferences={application.initialPreferences}
        modules={application.modules}
      />
    </StrictMode>,
  );
}
