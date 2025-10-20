import { useState } from "react";

type Props = {
  text: string;
  disabled?: boolean;
  className?: string;
  onCopied?: () => void;
};

export default function CopyButton({ text, disabled, className, onCopied }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (disabled) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    onCopied?.();
    setTimeout(() => setCopied(false), 1000);
  }

  return (
    <button
      disabled={disabled}
      onClick={handleCopy}
      className={[
        "rounded-lg px-3 py-2 text-sm border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] transition",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        className || "",
      ].join(" ")}
      aria-disabled={disabled}
      type="button"
    >
      {copied ? "Copied!" : "Copy Caption"}
    </button>
  );
}
