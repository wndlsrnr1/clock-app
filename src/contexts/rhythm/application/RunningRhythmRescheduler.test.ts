import { describe, expect, it, vi } from "vitest";
import { UserPreferences } from "../../preferences/domain/UserPreferences";
import { RunningRhythmRescheduler } from "./RunningRhythmRescheduler";
import { RhythmRuntime } from "./RhythmRuntime";
import type { NotificationPort, SchedulerPort, SoundPort, SystemClock } from "./ports";

class FakeScheduler implements SchedulerPort {
  public cancelledTaskIds: string[] = [];
  public scheduledAt: Date[] = [];
  private nextTaskNumber = 1;

  public schedule(occursAt: Date): string {
    this.scheduledAt.push(occursAt);
    const taskId = `task-${this.nextTaskNumber}`;
    this.nextTaskNumber += 1;

    return taskId;
  }

  public cancel(taskId: string): void {
    this.cancelledTaskIds.push(taskId);
  }
}

class FixedClock implements SystemClock {
  public constructor(private readonly fixedNow: Date) {}

  public now(): Date {
    return this.fixedNow;
  }
}

class FakeNotification implements NotificationPort {
  public notify = vi.fn<NotificationPort["notify"]>(() => Promise.resolve());
}

class FakeSound implements SoundPort {
  public prepare = vi.fn<SoundPort["prepare"]>(() => Promise.resolve());
  public play = vi.fn<SoundPort["play"]>(() => Promise.resolve());
  public stop = vi.fn<SoundPort["stop"]>(() => Promise.resolve());
}

function createRescheduler(): {
  runtime: RhythmRuntime;
  scheduler: FakeScheduler;
  rescheduler: RunningRhythmRescheduler;
} {
  const runtime = RhythmRuntime.empty();
  const scheduler = new FakeScheduler();
  const rescheduler = new RunningRhythmRescheduler(
    runtime,
    scheduler,
    new FakeNotification(),
    new FakeSound(),
    new FixedClock(new Date("2026-06-02T05:10:00")),
  );

  return { rescheduler, runtime, scheduler };
}

describe("RunningRhythmRescheduler", () => {
  it("cancels the current task and schedules the next event with the latest running preferences", () => {
    const { rescheduler, runtime, scheduler } = createRescheduler();
    runtime.start(UserPreferences.default());
    runtime.rememberTask("task-1");
    runtime.replacePreferences(UserPreferences.default().changeTerms(20, 5));

    rescheduler.rescheduleIfRunning();

    expect(scheduler.cancelledTaskIds).toEqual(["task-1"]);
    expect(scheduler.scheduledAt).toHaveLength(1);
    expect(scheduler.scheduledAt[0]?.getHours()).toBe(5);
    expect(scheduler.scheduledAt[0]?.getMinutes()).toBe(20);
  });

  it("does not reschedule when the rhythm is not running", () => {
    const { rescheduler, runtime, scheduler } = createRescheduler();
    runtime.start(UserPreferences.default());
    runtime.rememberTask("task-1");
    runtime.session.pause();
    runtime.replacePreferences(UserPreferences.default().changeTerms(20, 5));

    rescheduler.rescheduleIfRunning();

    expect(scheduler.cancelledTaskIds).toEqual([]);
    expect(scheduler.scheduledAt).toEqual([]);
  });
});
