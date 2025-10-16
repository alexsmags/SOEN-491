import type { LucideIcon } from "lucide-react";

interface IconButtonProps {
  onClick: () => void;
  Icon: LucideIcon;
  title?: string;
}

export default function IconButton({ onClick, Icon, title }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="h-8 w-full rounded-lg border border-white/10 bg-black/30 hover:bg-white/10 transition flex items-center justify-center"
    >
      <Icon size={16} />
    </button>
  );
}
