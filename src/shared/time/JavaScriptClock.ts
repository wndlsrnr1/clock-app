import type { Clock } from "./Clock";

export class JavaScriptClock implements Clock {
  public now(): Date {
    return new Date();
  }
}

