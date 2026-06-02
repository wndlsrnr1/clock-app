interface AnalogClockProps {
  now: Date;
}

export function AnalogClock({ now }: AnalogClockProps): React.JSX.Element {
  const second = now.getSeconds() + now.getMilliseconds() / 1000;
  const minute = now.getMinutes() + second / 60;
  const hour = (now.getHours() % 12) + minute / 60;

  return (
    <div className="analog-wrapper" aria-hidden="true">
      <div className="analog-clock">
        <div className="ticks">
          {Array.from({ length: 12 }, (_, index) => (
            <div className="tick" key={index} />
          ))}
        </div>
        <div className="hand hour" style={{ transform: `translate(-50%, -90%) rotate(${hour * 30}deg)` }} />
        <div className="hand minute" style={{ transform: `translate(-50%, -90%) rotate(${minute * 6}deg)` }} />
        <div className="hand second" style={{ transform: `translate(-50%, -90%) rotate(${second * 6}deg)` }} />
        <div className="center-cap" />
      </div>
    </div>
  );
}

