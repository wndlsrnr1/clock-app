export type RhythmSessionStatus = "idle" | "running" | "paused" | "stoppedForToday";

export class RhythmSession {
  private lastRungKey = "";
  private stoppedDateKey = "";

  private constructor(private currentStatus: RhythmSessionStatus) {}

  public static idle(): RhythmSession {
    return new RhythmSession("idle");
  }

  public static start(): RhythmSession {
    return new RhythmSession("running");
  }

  public get status(): RhythmSessionStatus {
    return this.currentStatus;
  }

  public canRing(eventTime: Date): boolean {
    if (this.currentStatus !== "running") {
      return false;
    }

    return this.lastRungKey !== this.eventKey(eventTime);
  }

  public markRung(eventTime: Date): void {
    this.lastRungKey = this.eventKey(eventTime);
  }

  public pause(): void {
    if (this.currentStatus === "running") {
      this.currentStatus = "paused";
    }
  }

  public resume(): void {
    if (this.currentStatus === "paused") {
      this.currentStatus = "running";
    }
  }

  public stopForToday(now: Date): void {
    this.stoppedDateKey = this.dateKey(now);
    this.currentStatus = "stoppedForToday";
  }

  public isStoppedFor(date: Date): boolean {
    return this.currentStatus === "stoppedForToday" && this.stoppedDateKey === this.dateKey(date);
  }

  private eventKey(date: Date): string {
    return `${this.dateKey(date)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  private dateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
}

