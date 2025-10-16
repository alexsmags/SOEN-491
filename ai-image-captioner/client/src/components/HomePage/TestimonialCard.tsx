import type { ReactNode } from "react";

type Props = {
  quote: string;
  name: string;
  title: string;
  avatarSrc?: string;
  className?: string;
  footer?: ReactNode;
};

export default function TestimonialCard({
  quote,
  name,
  title,
  avatarSrc,
  className,
  footer,
}: Props) {
  return (
    <div
      className={`rounded-2xl border border-white/10 p-6 md:p-8 bg-[#1e2128] flex flex-col justify-between ${className ?? ""}`}
    >
      <p className="text-white/80 italic leading-relaxed">{quote}</p>

      <div className="mt-6 flex items-center gap-3">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={name}
            className="w-10 h-10 rounded-full object-cover border border-white/10"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
            <span className="text-sm font-semibold text-white/80">
              {name.split(" ").map(p => p[0]).join("").slice(0, 2)}
            </span>
          </div>
        )}

        <div className="leading-tight">
          <div className="font-semibold">{name}</div>
          <div className="text-xs text-white/60">{title}</div>
        </div>
      </div>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}
