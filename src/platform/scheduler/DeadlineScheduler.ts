import type { SchedulerPort } from "../../contexts/rhythm/application/ports";

export class DeadlineScheduler implements SchedulerPort {
  private nextId = 1;
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  public schedule(occursAt: Date, callback: () => void): string {
    const taskId = `deadline-${this.nextId}`;
    this.nextId += 1;
    const delay = Math.max(0, occursAt.getTime() - Date.now());
    const timer = setTimeout((): void => {
      this.timers.delete(taskId);
      callback();
    }, delay);
    this.timers.set(taskId, timer);

    return taskId;
  }

  public cancel(taskId: string): void {
    const timer = this.timers.get(taskId);

    if (!timer) {
      return;
    }

    clearTimeout(timer);
    this.timers.delete(taskId);
  }
}
