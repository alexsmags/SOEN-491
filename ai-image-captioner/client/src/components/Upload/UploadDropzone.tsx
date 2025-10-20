import { useRef, useState } from "react";
import { Upload } from "lucide-react";

type Props = {
  onUpload: (file: File | null, previewUrl: string | null) => void;
  className?: string;
};

export default function UploadDropzone({ onUpload, className = "" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const setFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onUpload(file, url);
  };

  return (
    <div className={`h-full ${className}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          setFile(e.dataTransfer.files?.[0]);
        }}
        className={[
          "relative w-full h-full",
          "flex flex-col items-center justify-center",
          "rounded-xl border-2 border-dashed transition cursor-pointer select-none",
          dragOver ? "border-white/50 bg-white/[0.04]" : "border-white/20 bg-white/[0.02]",
          // keep a small minimum for tiny screens while still allowing full height
          "min-h-[16rem] overflow-hidden",
        ].join(" ")}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-contain rounded-lg"
          />
        ) : (
          <div className="text-center p-6">
            <Upload className="mx-auto mb-3 h-8 w-8 opacity-80" />
            <p className="text-base md:text-lg font-medium">
              Drag & Drop Image Here
            </p>
            <p className="text-xs md:text-sm text-white/60 mt-1">
              Or click to browse files
            </p>
            <button
              className="mt-4 rounded-lg px-3 py-1.5 text-sm border border-white/15 bg-[#364881] hover:bg-[#4d5ca1] transition"
              type="button"
            >
              Browse Files
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
