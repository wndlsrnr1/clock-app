import { SvgIcon, type SvgIconName } from "./SvgIcon";

interface IconButtonProps {
  icon: SvgIconName;
  label: string;
  active?: boolean;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger" | "subtle";
}

export function IconButton({
  active = false,
  children,
  className = "",
  disabled = false,
  icon,
  label,
  onClick,
  type = "button",
  variant = "secondary",
}: IconButtonProps): React.JSX.Element {
  const classNames = [
    "icon-action",
    `icon-action-${variant}`,
    active ? "active" : "",
    children ? "with-label" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      aria-label={label}
      className={classNames}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type={type}
    >
      <SvgIcon name={icon} />
      {children ? <span>{children}</span> : null}
    </button>
  );
}
