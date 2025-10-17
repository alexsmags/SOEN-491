import { ArrowUpRight } from "lucide-react";

type ShareFabProps = {
  visible: boolean;
  open: boolean;
  onClick: () => void;
};

export function ShareFab({ visible, onClick, open }: ShareFabProps) {
  return (
    <button
      onClick={onClick}
      className={[
        "fixed z-[75] right-5 md:right-8",
        "rounded-full shadow-lg shadow-black/30 border border-white/10",
        "bg-[#364881] hover:bg-[#3b477e] active:scale-[0.98]",
        "w-14 h-14 grid place-items-center",
        "transition-all duration-300 ease-out",
        open ? "bottom-[7.75rem]" : "bottom-24",
        visible ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none",
      ].join(" ")}
      aria-label="Share"
      title="Share"
      style={{
        animation: visible ? "capto-bounce-in 420ms cubic-bezier(.2,.8,.2,1)" : undefined,
      }}
    >
      <ArrowUpRight size={22} className="opacity-95" />
      <style>{`
        @keyframes capto-bounce-in {
          0% { transform: translateY(8px) scale(.9); opacity: 0; }
          60% { transform: translateY(-4px) scale(1.03); opacity: 1; }
          100% { transform: translateY(0) scale(1); }
        }
      `}</style>
    </button>
  );
}
