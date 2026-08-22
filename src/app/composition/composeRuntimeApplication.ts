import { init } from "@neutralinojs/lib";
import type { RuntimeApplication } from "../contracts/AppModules";
import { isNeutralinoRuntime } from "../infrastructure/neutralino/NeutralinoRuntimeGlobals";
import { composeBrowserApplication } from "./composeBrowserApplication";
import { composeNeutralinoApplication } from "./composeNeutralinoApplication";

export async function composeRuntimeApplication(): Promise<RuntimeApplication> {
  if (!isNeutralinoRuntime()) {
    return composeBrowserApplication();
  }

  init();
  return composeNeutralinoApplication();
}
