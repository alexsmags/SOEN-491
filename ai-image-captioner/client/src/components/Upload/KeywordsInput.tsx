import { useState, useRef } from "react";
import { X } from "lucide-react";

type Props = {
  value: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
  max?: number;
};

export default function KeywordsInput({
  value,
  onChange,
  placeholder = "Type a keyword and press Enter…",
  max,
}: Props) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addKeyword(raw: string) {
    const k = raw.trim();
    if (!k) return;
    if (max && value.length >= max) return;
    if (value.some((v) => v.toLowerCase() === k.toLowerCase())) return;
    onChange([...value, k]);
    setInput("");
  }

  function removeKeyword(idx: number) {
    const copy = [...value];
    copy.splice(idx, 1);
    onChange(copy);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div>
      <label className="text-sm text-white/70 block mb-2">Keywords</label>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {value.map((k, i) => (
            <span
              key={`${k}-${i}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-sm"
            >
              {k}
              <button
                type="button"
                onClick={() => removeKeyword(i)}
                className="ml-1 rounded hover:bg-white/20 p-0.5"
                aria-label={`Remove ${k}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 flex items-center">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addKeyword(input);
            } else if (e.key === "," && input.trim()) {
              e.preventDefault();
              addKeyword(input.replace(/,$/, ""));
            } else if (e.key === "Backspace" && !input && value.length) {
              removeKeyword(value.length - 1);
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm placeholder-white/50"
        />
      </div>

      {max ? (
        <p className="mt-1 text-xs text-white/50">
          {value.length}/{max} keywords
        </p>
      ) : null}
    </div>
  );
}