import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";

type Props = {
  onUpload: (file: File | null, previewUrl: string | null) => void;
  onError?: (message: string) => void;
  className?: string;
};

const MAX_FILE_SIZE_MB = 10; 
const MAX_MEGAPIXELS = 40;

function isAllowedType(file: File) {
  return /image\/(jpeg|jpg|png)/i.test(file.type);
}

async function checkImageDimensions(blobUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Unable to read image"));
    img.src = blobUrl;
  });
}

export default function UploadDropzone({ onUpload, onError, className = "" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const validateAndSetFile = async (file?: File) => {
    if (!file) return;

    if (!isAllowedType(file)) {
      onUpload(null, null);
      onError?.("Unsupported file format. Please upload a JPEG or PNG image.");
      return;
    }

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_FILE_SIZE_MB) {
      onUpload(null, null);
      onError?.(
        `Image is too large (${sizeMb.toFixed(1)} MB). Maximum allowed is ${MAX_FILE_SIZE_MB} MB.`
      );
      return;
    }

    const url = URL.createObjectURL(file);
    try {
      const { width, height } = await checkImageDimensions(url);
      const megapixels = (width * height) / 1_000_000;
      if (megapixels > MAX_MEGAPIXELS) {
        URL.revokeObjectURL(url);
        onUpload(null, null);
        onError?.(
          `Image resolution is too large (${width}×${height} ≈ ${megapixels.toFixed(
            1
          )} MP). Max allowed is ${MAX_MEGAPIXELS} MP.`
        );
        return;
      }

      if (preview) URL.revokeObjectURL(preview);
      setPreview(url);
      onUpload(file, url);
    } catch {
      URL.revokeObjectURL(url);
      onUpload(null, null);
      onError?.("We couldn't read that image. Please try another file.");
    }
  };

  return (
    <div className={`h-full ${className}`}>
      <div
        role="button"
        tabIndex={0}
        data-testid="dropzone"
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
          validateAndSetFile(e.dataTransfer.files?.[0]);
        }}
        className={[
          "relative w-full h-full",
          "flex flex-col items-center justify-center",
          "rounded-xl border-2 border-dashed transition cursor-pointer select-none",
          dragOver ? "border-white/50 bg-white/[0.04]" : "border-white/20 bg-white/[0.02]",
          "min-h-[16rem] overflow-hidden",
        ].join(" ")}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            data-testid="preview-image"
            className="w-full h-full object-contain rounded-lg"
          />
        ) : (
          <div className="text-center p-6">
            <Upload className="mx-auto mb-3 h-8 w-8 opacity-80" aria-hidden="true" />
            <p className="text-base md:text-lg font-medium">Drag & Drop Image Here</p>
            <p className="text-xs md:text-sm text-white/60 mt-1">Or click to browse files</p>
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
          accept="image/jpeg,image/png"
          className="hidden"
          data-testid="file-input"
          onChange={(e) => validateAndSetFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
