import React, { useEffect, useRef } from "react";

type ModalProps = {
  open: boolean;
  title?: string | React.ReactNode;
  message?: string | React.ReactNode;
  children?: React.ReactNode;
  confirmText?: string;
  onConfirm: () => void;
  tone?: "default" | "danger";
};

export default function Modal({
  open,
  title = "Notice",
  message,
  children,
  confirmText = "OK",
  onConfirm,
  tone = "default",
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onConfirm();
      if (e.key === "Enter" && dialogRef.current?.contains(document.activeElement)) {
        onConfirm();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onConfirm]);

  if (!open) return null;

  const confirmClasses =
    tone === "danger"
      ? "bg-red-500 text-white hover:bg-red-400"
      : "bg-white/90 text-black hover:bg-white";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : "Dialog"}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onConfirm();
      }}
      data-testid="base-modal"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-[#0b0f16] text-white border border-white/10 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold" data-testid="modal-title">
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-5 py-4 text-sm text-white/80" data-testid="modal-body">
          {message && (typeof message === "string" ? <p>{message}</p> : message)}
          {children}
        </div>

        {/* Single Button Footer */}
        <div className="px-5 py-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onConfirm}
            className={`px-3 py-1.5 text-xs rounded-lg ${confirmClasses}`}
            data-testid="modal-confirm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
