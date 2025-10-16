import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  title: string;
  desc: string;
  className?: string;
};

export default function FeatureCard({ icon, title, desc, className }: Props) {
  return (
    <div
      className={`rounded-2xl border border-white/10 p-6 h-full flex flex-col items-center text-center ${className ?? ""}`}
      style={{ backgroundColor: "#1e2128" }}
    >
      <div className="flex items-center justify-center mb-5 text-[#364881]">
        <div className="[&>*]:w-10 [&>*]:h-10">{icon}</div>
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-white/70 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
