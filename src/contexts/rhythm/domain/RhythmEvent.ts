export type RhythmEventKind = "focusEnds" | "restEnds";

export interface RhythmEvent {
  kind: RhythmEventKind;
  occursAt: Date;
}

