interface DigitalClockProps {
  now: Date;
}

export function DigitalClock({ now }: DigitalClockProps): React.JSX.Element {
  return (
    <div className="time digital-time">
      {formatClockPart(now.getHours())} : {formatClockPart(now.getMinutes())} : {formatClockPart(now.getSeconds())}
    </div>
  );
}

function formatClockPart(value: number): string {
  return String(value).padStart(2, "0");
}

