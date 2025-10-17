import { useRef, useState } from "react";
import { Upload } from "lucide-react";

type ImagePickerProps = {
  value: string | null;
  onChange: (src: string | null) => void;
};

const PRESETS: string[] = [
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop",
];

export function ImagePicker({ value, onChange }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<string[]>(PRESETS);

  const onUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setItems((arr) => [src, ...arr]);
      onChange(src);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <button
          onClick={() => inputRef.current?.click()}
          className="aspect-[4/3] rounded-xl border border-dashed border-white/15 bg-white/[0.03] hover:bg-white/[0.06] transition grid place-items-center text-white/80"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
          />
          <div className="flex flex-col items-center gap-1 text-sm">
            <Upload size={18} className="opacity-90" />
            <span>Upload</span>
          </div>
        </button>

        {items.map((src) => {
          const active = value === src;
          return (
            <button
              key={src}
              onClick={() => onChange(active ? null : src)}
              className={[
                "group relative aspect-[4/3] rounded-xl overflow-hidden border transition",
                active
                  ? "border-[#3b477e] ring-2 ring-[#3b477e]/50"
                  : "border-white/10 hover:border-white/20",
              ].join(" ")}
            >
              <img
                src={src}
                alt="Gallery"
                className="w-full h-full object-cover group-active:scale-[0.99] transition-transform"
              />
              <div
                className={[
                  "absolute inset-0 pointer-events-none",
                  active ? "bg-[#3b477e]/20" : "bg-transparent",
                ].join(" ")}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
