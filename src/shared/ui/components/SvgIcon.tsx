export type SvgIconName =
  | "bell"
  | "check"
  | "clock"
  | "grip"
  | "music"
  | "pause"
  | "pencil"
  | "play"
  | "plus"
  | "minus"
  | "save"
  | "stop"
  | "trash"
  | "volume"
  | "volumeMuted"
  | "x";

interface SvgIconProps {
  name: SvgIconName;
}

export function SvgIcon({ name }: SvgIconProps): React.JSX.Element {
  return (
    <svg aria-hidden="true" className="svg-icon" focusable="false" viewBox="0 0 24 24">
      {iconPath(name)}
    </svg>
  );
}

function iconPath(name: SvgIconName): React.JSX.Element {
  if (name === "play") {
    return <path d="M8 5v14l11-7-11-7Z" />;
  }

  if (name === "pause") {
    return <path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z" />;
  }

  if (name === "stop") {
    return <path d="M7 7h10v10H7V7Z" />;
  }

  if (name === "clock") {
    return <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm1 9.1 3.2 1.9-1 1.7-4.2-2.5V7h2v5.1Z" />;
  }

  if (name === "grip") {
    return <path d="M8 5h2v2H8V5Zm6 0h2v2h-2V5ZM8 11h2v2H8v-2Zm6 0h2v2h-2v-2ZM8 17h2v2H8v-2Zm6 0h2v2h-2v-2Z" />;
  }

  if (name === "music") {
    return <path d="M17 3v11.2A3.4 3.4 0 1 1 15 11V7H9v9.2A3.4 3.4 0 1 1 7 13V5h10Z" />;
  }

  if (name === "bell") {
    return <path d="M12 22a2.8 2.8 0 0 0 2.6-1.8H9.4A2.8 2.8 0 0 0 12 22Zm7-5-1.9-2.1V10a5.1 5.1 0 0 0-4-5V3a1.1 1.1 0 0 0-2.2 0v2a5.1 5.1 0 0 0-4 5v4.9L5 17v1h14v-1Z" />;
  }

  if (name === "volume") {
    return <path d="M4 9v6h4l5 4V5L8 9H4Zm11.4-1.4 1.4-1.4A8 8 0 0 1 19 12a8 8 0 0 1-2.2 5.6l-1.4-1.4A6 6 0 0 0 17 12a6 6 0 0 0-1.6-4.4Z" />;
  }

  if (name === "volumeMuted") {
    return <path d="M4 9v6h4l5 4V5L8 9H4Zm14.8-.8-1.4-1.4-2.2 2.2-2.2-2.2-1.4 1.4 2.2 2.2-2.2 2.2 1.4 1.4 2.2-2.2 2.2 2.2 1.4-1.4-2.2-2.2 2.2-2.2Z" />;
  }

  if (name === "plus") {
    return <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" />;
  }

  if (name === "minus") {
    return <path d="M5 11h14v2H5v-2Z" />;
  }

  if (name === "check" || name === "save") {
    return <path d="m9.2 16.2-4-4 1.4-1.4 2.8 2.8 7-7 1.4 1.4-8.4 8.4-.2-.2Z" />;
  }

  if (name === "pencil") {
    return <path d="M5 17.2V20h2.8L18.5 9.3l-2.8-2.8L5 17.2ZM19.6 8.2l1-1a1.5 1.5 0 0 0 0-2.1l-1.7-1.7a1.5 1.5 0 0 0-2.1 0l-1 1 3.8 3.8Z" />;
  }

  if (name === "trash") {
    return <path d="M8 21h8a2 2 0 0 0 2-2V8H6v11a2 2 0 0 0 2 2ZM9 4l1-1h4l1 1h4v2H5V4h4Z" />;
  }

  return <path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z" />;
}
