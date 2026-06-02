import type { RhythmRuntime } from "./RhythmRuntime";
import type { NotificationPort, SchedulerPort, SoundPort, SystemClock } from "./ports";

export function scheduleNextRhythmEvent(
  runtime: RhythmRuntime,
  scheduler: SchedulerPort,
  notification: NotificationPort | null,
  sound: SoundPort | null,
  clock: SystemClock,
): void {
  const event = runtime.currentSchedule().nextEventAfter(clock.now());
  const taskId = scheduler.schedule(event.occursAt, () => {
    if (!runtime.session.canRing(event.occursAt)) {
      return;
    }

    runtime.session.markRung(event.occursAt);
    void notification?.notify(event);
    void sound?.play();
    scheduleNextRhythmEvent(runtime, scheduler, notification, sound, clock);
  });

  runtime.rememberTask(taskId);
}

