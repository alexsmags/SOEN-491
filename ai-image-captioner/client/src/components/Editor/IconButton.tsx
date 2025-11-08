import type { LucideIcon } from "lucide-react";

interface IconButtonProps {
  onClick: () => void;
  Icon: LucideIcon;
  title?: string;
  "data-testid"?: string;
}

export default function IconButton({ onClick, Icon, title, "data-testid": dataTestId }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="h-8 w-full rounded-lg border border-white/10 bg-black/30 hover:bg-white/10 transition flex items-center justify-center"
      data-testid={dataTestId ?? "icon-button"}
    >
      <Icon size={16} />
    </button>
  );
}
