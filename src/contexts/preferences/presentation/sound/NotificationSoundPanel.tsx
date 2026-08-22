import { useState } from "react";
import { IconButton } from "../../../../shared/ui/components/IconButton";
import type { TextCatalog } from "../../../../shared/i18n/catalog";
import type { PreferencesAppViewModel } from "../usePreferencesApp";

interface NotificationSoundPanelProps {
  preferences: PreferencesAppViewModel;
  text: TextCatalog;
}

export function NotificationSoundPanel({ preferences, text }: NotificationSoundPanelProps): React.JSX.Element {
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const sound = preferences.preferences.notificationSound;
  const label = sound.mode === "custom"
    ? sound.customFileName ?? text.sound.customFallback
    : sound.mode === "muted"
      ? text.sound.mutedLabel
      : text.sound.defaultLabel;
  const volumePercent = Math.round(sound.volume * 100);
  const muteActionLabel = sound.mode === "muted" ? text.sound.actions.unmute : text.sound.actions.mute;
  const muteActionIcon = sound.mode === "muted" ? "volume" : "volumeMuted";

  return (
    <section className="sound-panel panel-surface" aria-labelledby="sound-title">
      <div className="panel-header compact-header">
        <div>
          <p className="eyebrow">{text.sound.eyebrow}</p>
          <h2 id="sound-title">{text.sound.title}</h2>
        </div>
        <span className="date-pill">{label}</span>
      </div>
      <div className="sound-actions">
        <div className="icon-toolbar slim-buttons">
          <IconButton icon="music" label={text.sound.actions.chooseMp3} onClick={() => void preferences.chooseCustomNotificationSound()} />
          <IconButton icon="bell" label={text.sound.actions.useDefault} onClick={() => void preferences.useDefaultNotificationSound()}>{text.sound.actions.useDefault}</IconButton>
          <IconButton active={sound.mode === "muted"} icon={muteActionIcon} label={muteActionLabel} onClick={() => void preferences.muteNotificationSound()} />
          <IconButton
            active={preferences.isPreviewingSound}
            disabled={sound.mode === "muted"}
            icon={preferences.isPreviewingSound ? "stop" : "play"}
            label={preferences.isPreviewingSound ? text.sound.actions.stopPreview : text.sound.actions.preview}
            onClick={() => void preferences.toggleNotificationSoundPreview()}
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
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => void preferences.changeNotificationSoundVolume(Number(event.target.value) / 100)}
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
