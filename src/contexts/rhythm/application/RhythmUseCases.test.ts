import { describe, expect, it, vi } from "vitest";
import { UserPreferences } from "../../preferences/domain/UserPreferences";
import { GetRhythmStatusUseCase } from "./GetRhythmStatusUseCase";
import { PauseRhythmUseCase } from "./PauseRhythmUseCase";
import { ResumeRhythmUseCase } from "./ResumeRhythmUseCase";
import { RhythmRuntime } from "./RhythmRuntime";
import { StartRhythmUseCase } from "./StartRhythmUseCase";
import { StopRhythmForTodayUseCase } from "./StopRhythmForTodayUseCase";
import type { SchedulerPort, SettingsRepository, SoundPort, SystemClock, TrayPort } from "./ports";

class FakeSettingsRepository implements SettingsRepository {
  public constructor(private preferences: UserPreferences = UserPreferences.default()) {}

  public async get(): Promise<UserPreferences> {
    return this.preferences;
  }

  public async save(preferences: UserPreferences): Promise<void> {
    this.preferences = preferences;
  }
}

class FakeScheduler implements SchedulerPort {
  public scheduledAt: Date | null = null;
  public cancelledTaskIds: string[] = [];

  public schedule(occursAt: Date, callback: () => void): string {
    this.scheduledAt = occursAt;
    this.callback = callback;
    return "task-1";
  }

  public cancel(taskId: string): void {
    this.cancelledTaskIds.push(taskId);
  }

  private callback: (() => void) | null = null;
}

class FakeSound implements SoundPort {
  public prepare = vi.fn<() => Promise<void>>(() => Promise.resolve());
  public play = vi.fn<() => Promise<void>>(() => Promise.resolve());
  public stop = vi.fn<() => Promise<void>>(() => Promise.resolve());
}

class FakeTray implements TrayPort {
  public statuses: string[] = [];

  public async updateStatus(status: string): Promise<void> {
    this.statuses.push(status);
  }
}

class FixedClock implements SystemClock {
  public constructor(private readonly fixedNow: Date) {}

  public now(): Date {
    return this.fixedNow;
  }
}

function createUseCases(now: Date): {
  runtime: RhythmRuntime;
  scheduler: FakeScheduler;
  sound: FakeSound;
  tray: FakeTray;
  start: StartRhythmUseCase;
  pause: PauseRhythmUseCase;
  resume: ResumeRhythmUseCase;
  stopForToday: StopRhythmForTodayUseCase;
  status: GetRhythmStatusUseCase;
} {
  const runtime = RhythmRuntime.empty();
  const settingsRepository = new FakeSettingsRepository();
  const scheduler = new FakeScheduler();
  const sound = new FakeSound();
  const tray = new FakeTray();
  const clock = new FixedClock(now);

  return {
    runtime,
    scheduler,
    sound,
    tray,
    start: new StartRhythmUseCase(runtime, settingsRepository, scheduler, sound, tray, clock),
    pause: new PauseRhythmUseCase(runtime, scheduler, tray),
    resume: new ResumeRhythmUseCase(runtime, scheduler, tray, clock),
    stopForToday: new StopRhythmForTodayUseCase(runtime, scheduler, tray, clock),
    status: new GetRhythmStatusUseCase(runtime),
  };
}

describe("Rhythm use cases", () => {
  it("starts the rhythm and schedules the next focus boundary", async () => {
    const useCases = createUseCases(new Date("2026-06-02T05:10:00"));

    const status = await useCases.start.execute();

    expect(status.sessionStatus).toBe("running");
    expect(useCases.sound.prepare).toHaveBeenCalledOnce();
    expect(useCases.scheduler.scheduledAt?.getHours()).toBe(5);
    expect(useCases.scheduler.scheduledAt?.getMinutes()).toBe(50);
  });

  it("pauses, resumes, and cancels scheduled work around each transition", async () => {
    const useCases = createUseCases(new Date("2026-06-02T05:10:00"));
    await useCases.start.execute();

    await useCases.pause.execute();
    expect(useCases.status.execute().sessionStatus).toBe("paused");
    expect(useCases.scheduler.cancelledTaskIds).toContain("task-1");

    await useCases.resume.execute();
    expect(useCases.status.execute().sessionStatus).toBe("running");
    expect(useCases.scheduler.scheduledAt?.getMinutes()).toBe(50);
  });

  it("stops for today and keeps the stopped status for the same day", async () => {
    const useCases = createUseCases(new Date("2026-06-02T09:00:00"));
    await useCases.start.execute();

    await useCases.stopForToday.execute();

    expect(useCases.status.execute().sessionStatus).toBe("stoppedForToday");
    expect(useCases.runtime.session.isStoppedFor(new Date("2026-06-02T17:00:00"))).toBe(true);
  });

  it("reports the current notification sound preference in the rhythm status", () => {
    const useCases = createUseCases(new Date("2026-06-02T05:10:00"));
    useCases.runtime.replacePreferences(UserPreferences.default().toggleNotificationSoundMute());

    const status = useCases.status.execute();

    expect(status.notificationSound.mode).toBe("muted");
  });
});
