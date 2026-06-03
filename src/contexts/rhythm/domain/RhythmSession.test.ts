import { describe, expect, it } from "vitest";
import { RhythmSession } from "./RhythmSession";

describe("RhythmSession", () => {
  it("starts as running and avoids ringing the same event twice", () => {
    const session = RhythmSession.start();
    const eventTime = new Date("2026-06-02T05:50:00");

    expect(session.canRing(eventTime)).toBe(true);
    session.markRung(eventTime);

    expect(session.canRing(eventTime)).toBe(false);
    expect(session.status).toBe("running");
  });

  it("pauses, resumes, and stops for the current day", () => {
    const session = RhythmSession.start();

    session.pause();
    expect(session.status).toBe("paused");

    session.resume();
    expect(session.status).toBe("running");

    session.stopForToday(new Date("2026-06-02T09:00:00"));
    expect(session.status).toBe("stoppedForToday");
    expect(session.isStoppedFor(new Date("2026-06-02T17:00:00"))).toBe(true);
    expect(session.isStoppedFor(new Date("2026-06-03T05:00:00"))).toBe(false);
  });
});

