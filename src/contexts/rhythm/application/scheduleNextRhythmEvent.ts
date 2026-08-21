import type { RhythmRuntime } from "./RhythmRuntime";
import type { Clock } from "../../../shared/time/Clock";
import type { NotificationPort, SchedulerPort, SoundPort } from "./ports";

export function scheduleNextRhythmEvent(
  runtime: RhythmRuntime,
  scheduler: SchedulerPort,
  notification: NotificationPort | null,
  sound: SoundPort | null,
  clock: Clock,
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

