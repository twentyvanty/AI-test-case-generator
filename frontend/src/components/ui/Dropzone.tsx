import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils/cn";

const ACCEPTED = [".pdf", ".docx", ".md", ".markdown", ".txt"];
const MAX_BYTES = 20 * 1024 * 1024;

type DropzoneProps = {
  // Called with the files that passed the type/size check
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
};

// Drag-and-drop (or click) picker for requirement documents
function Dropzone({ onFiles, disabled = false, className }: DropzoneProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const pick = (picked: FileList | null) => {
    const files = Array.from(picked ?? []);
    const problems: string[] = [];

    const accepted = files.filter((file) => {
      const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

      if (!ACCEPTED.includes(extension)) {
        problems.push(t("dropzone.unsupported", { name: file.name }));
        return false;
      }

      if (file.size > MAX_BYTES) {
        problems.push(t("dropzone.tooLarge", { name: file.name }));
        return false;
      }

      return true;
    });

    setErrors(problems);

    if (accepted.length > 0) {
      onFiles(accepted);
    }
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);

    if (!disabled) {
      pick(event.dataTransfer.files);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "w-full rounded-2xl border border-dashed px-4 py-6 text-center transition disabled:cursor-not-allowed disabled:opacity-50",
          dragging
            ? "border-brand bg-brand-soft/60"
            : "border-gray-300 bg-white/50 hover:bg-white/80"
        )}
      >
        <p className="text-sm font-medium text-gray-700">{t("dropzone.title")}</p>
        <p className="mt-1 text-xs text-gray-500">{t("dropzone.hint")}</p>
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(event) => {
          pick(event.target.files);
          // Allow picking the same file again later
          event.target.value = "";
        }}
      />

      {errors.map((error) => (
        <p key={error} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ))}
    </div>
  );
}

export default Dropzone;
