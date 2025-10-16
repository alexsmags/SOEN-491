import type { WorkspaceItem } from "../../data/workspaceData";
import { MoreHorizontal, Edit3, Tag } from "lucide-react";

type Props = {
  item: WorkspaceItem;
  className?: string;
  onEdit?: (id: string) => void;
  onMore?: (id: string) => void;
};

export default function MediaCard({ item, className, onEdit, onMore }: Props) {
  return (
    <article
      className={[
        "rounded-2xl bg-[#1e2128] border border-white/10 overflow-hidden",
        "shadow-[0_8px_20px_-10px_rgba(0,0,0,0.6)]",
        className ?? "",
      ].join(" ")}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Top row: pill + date */}
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold bg-[#E6D465] text-black/80 shadow">
            <Tag size={12} className="opacity-80" />
            {item.title}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-black/60 text-white/80 border border-white/10">
            {item.date}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-4">
        <p className="text-sm text-white/85 leading-relaxed line-clamp-3">
          {item.caption}
        </p>
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 bg-black/30 border-t border-white/10 flex items-center justify-between">
        <button
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 hover:bg-white/10 px-3 py-1.5 text-sm transition"
          onClick={() => (onEdit ? onEdit(item.id) : console.log("Edit", item.id))}
        >
          <Edit3 size={14} />
          Edit
        </button>
        <button
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-black/40 hover:bg-white/10 transition"
          aria-label="More actions"
          onClick={() => (onMore ? onMore(item.id) : console.log("More", item.id))}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </article>
  );
}
