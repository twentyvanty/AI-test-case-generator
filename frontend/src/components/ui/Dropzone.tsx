import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils/cn";

const ACCEPTED = ".pdf,.docx,.md,.markdown,.txt";
const MAX_BYTES = 20 * 1024 * 1024;

type DropzoneProps = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  className?: string;
};

// Drag-and-drop (or click) file picker for requirement documents.
// TODO: files are only selected for now — uploading/parsing needs a backend endpoint.
function Dropzone({ file, onFileChange, className }: DropzoneProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = (picked: File | undefined) => {
    if (!picked) {
      return;
    }

    if (picked.size > MAX_BYTES) {
      setError(t("dropzone.tooLarge"));
      return;
    }

    setError(null);
    onFileChange(picked);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    pick(event.dataTransfer.files[0]);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "w-full rounded-2xl border border-dashed px-4 py-6 text-center transition",
          dragging
            ? "border-brand bg-brand-soft/60"
            : "border-gray-300 bg-white/50 hover:bg-white/80"
        )}
      >
        <p className="text-sm font-medium text-gray-700">
          {file ? file.name : t("dropzone.title")}
        </p>
        <p className="mt-1 text-xs text-gray-500">{t("dropzone.hint")}</p>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(event) => pick(event.target.files?.[0])}
      />

      {file && (
        <button
          type="button"
          onClick={() => onFileChange(null)}
          className="mt-1.5 text-xs text-gray-500 underline hover:text-ink"
        >
          {t("dropzone.remove")}
        </button>
      )}

      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

export default Dropzone;
