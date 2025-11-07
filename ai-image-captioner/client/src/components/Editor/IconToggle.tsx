import type { LucideIcon } from "lucide-react";

interface IconToggleProps {
  active?: boolean;
  onClick: () => void;
  Icon: LucideIcon;
  title?: string;
  "data-testid"?: string;
}

export default function IconToggle({ active, onClick, Icon, title, "data-testid": dataTestId }: IconToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={[
        "h-8 w-full rounded-lg border transition flex items-center justify-center",
        active ? "border-white/20 bg-white/10" : "border-white/10 bg-black/30 hover:bg-white/10",
      ].join(" ")}
      data-testid={dataTestId ?? "icon-toggle"}
    >
      <Icon size={16} />
    </button>
  );
}
