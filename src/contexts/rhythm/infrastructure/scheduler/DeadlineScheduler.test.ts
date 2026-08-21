import { describe, expect, it, vi } from "vitest";
import { DeadlineScheduler } from "./DeadlineScheduler";

describe("DeadlineScheduler", () => {
  it("runs a callback when the target time arrives", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T05:10:00"));
    const scheduler = new DeadlineScheduler();
    const callback = vi.fn();

    scheduler.schedule(new Date("2026-06-02T05:10:05"), callback);
    vi.advanceTimersByTime(4999);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("cancels scheduled callbacks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T05:10:00"));
    const scheduler = new DeadlineScheduler();
    const callback = vi.fn();

    const taskId = scheduler.schedule(new Date("2026-06-02T05:10:05"), callback);
    scheduler.cancel(taskId);
    vi.advanceTimersByTime(5000);

    expect(callback).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("removes completed timers after the callback runs", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T05:10:00"));
    const scheduler = new DeadlineScheduler();

    scheduler.schedule(new Date("2026-06-02T05:10:05"), vi.fn());
    expect(scheduledTimerCount(scheduler)).toBe(1);

    vi.advanceTimersByTime(5000);

    expect(scheduledTimerCount(scheduler)).toBe(0);
    vi.useRealTimers();
  });
});

function scheduledTimerCount(scheduler: DeadlineScheduler): number {
  return (scheduler as unknown as { timers: Map<string, ReturnType<typeof setTimeout>> }).timers.size;
}
