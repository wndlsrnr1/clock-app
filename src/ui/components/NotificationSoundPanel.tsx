import { useState } from "react";
import type { TextCatalog } from "../textCatalog";
import type { RhythmAppViewModel } from "../useRhythmApp";
import { IconButton } from "./IconButton";

interface NotificationSoundPanelProps {
  rhythm: RhythmAppViewModel;
  text: TextCatalog;
}

export function NotificationSoundPanel({ rhythm, text }: NotificationSoundPanelProps): React.JSX.Element {
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const sound = rhythm.status.notificationSound;
  const label = sound.mode === "custom"
    ? sound.customFileName ?? text.sound.customFallback
    : sound.mode === "muted"
      ? text.sound.mutedLabel
      : text.sound.defaultLabel;
  const volumePercent = Math.round(sound.volume * 100);
  const muteActionLabel = sound.mode === "muted" ? text.sound.actions.unmute : text.sound.actions.mute;
  const muteActionIcon = sound.mode === "muted" ? "volume" : "volumeMuted";

  return (
    <section className="sound-panel" aria-labelledby="sound-title">
      <div className="panel-header compact-header">
        <div>
          <p className="eyebrow">{text.sound.eyebrow}</p>
          <h2 id="sound-title">{text.sound.title}</h2>
        </div>
        <span className="date-pill">{label}</span>
      </div>
      <div className="sound-actions">
        <div className="icon-toolbar slim-buttons">
          <IconButton icon="music" label={text.sound.actions.chooseMp3} onClick={() => void rhythm.chooseCustomNotificationSound()} />
          <IconButton icon="bell" label={text.sound.actions.useDefault} onClick={() => void rhythm.useDefaultNotificationSound()}>{text.sound.actions.useDefault}</IconButton>
          <IconButton active={sound.mode === "muted"} icon={muteActionIcon} label={muteActionLabel} onClick={() => void rhythm.muteNotificationSound()} />
          <IconButton
            active={rhythm.isPreviewing}
            disabled={sound.mode === "muted"}
            icon={rhythm.isPreviewing ? "stop" : "play"}
            label={rhythm.isPreviewing ? text.sound.actions.stopPreview : text.sound.actions.preview}
            onClick={() => void rhythm.toggleNotificationSoundPreview()}
            variant="primary"
          />
        </div>
        <div className="volume-popover">
          <IconButton
            icon="volume"
            label={text.sound.actions.volume}
            onClick={() => setIsVolumeOpen((open: boolean): boolean => !open)}
          >
            {volumePercent}%
          </IconButton>
          {isVolumeOpen ? (
            <label className="volume-slider-wrap">
              <span className="label">{text.sound.volumeLabel}</span>
              <input
                aria-label={text.sound.actions.volume}
                max={100}
                min={0}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => void rhythm.changeNotificationSoundVolume(Number(event.target.value) / 100)}
                type="range"
                value={volumePercent}
              />
            </label>
          ) : null}
        </div>
      </div>
      {sound.volume === 0 && sound.mode !== "muted" ? <p className="warning-text">{text.sound.warnings.zeroVolume}</p> : null}
    </section>
  );
}
