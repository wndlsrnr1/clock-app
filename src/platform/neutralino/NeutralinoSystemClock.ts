import type { SystemClock } from "../../contexts/rhythm/application/ports";

export class NeutralinoSystemClock implements SystemClock {
  public now(): Date {
    return new Date();
  }
}

