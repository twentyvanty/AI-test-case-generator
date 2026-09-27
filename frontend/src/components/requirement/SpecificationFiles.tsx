import { useTranslation } from "react-i18next";
import { formatFileSize } from "../../utils/format";
import Dropzone from "../ui/Dropzone";
import Spinner from "../ui/Spinner";

export type Attachment = {
  fileName: string;
  // Unknown for files attached in an earlier visit (only the name is saved)
  size: number | null;
  // The exact text block this file added to the details, so removing the file
  // can take its text out again (null if unknown)
  block: string | null;
};

type SpecificationFilesProps = {
  attachments: Attachment[];
  // File names being read right now
  reading: string[];
  // Files whose text couldn't be read, with the reason
  problems: string[];
  onFiles: (files: File[]) => void;
  onRemove: (fileName: string) => void;
  disabled: boolean;
};

function SpecificationFiles({
  attachments,
  reading,
  problems,
  onFiles,
  onRemove,
  disabled,
}: SpecificationFilesProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <Dropzone onFiles={onFiles} disabled={disabled} />

      {reading.map((fileName) => (
        <Spinner
          key={fileName}
          className="px-1"
          label={t("specificationFiles.reading", { name: fileName })}
        />
      ))}

      {problems.map((problem) => (
        <p key={problem} className="text-xs text-danger">
          {problem}
        </p>
      ))}

      {attachments.length > 0 && (
        <ul className="divide-y divide-gray-200/80 rounded-xl border border-gray-200 bg-white/70">
          {attachments.map((attachment) => (
            <li
              key={attachment.fileName}
              className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm"
            >
              <span className="min-w-0 truncate text-ink">{attachment.fileName}</span>

              <span className="flex shrink-0 items-center gap-3">
                {attachment.size !== null && (
                  <span className="font-mono text-xs text-gray-500">
                    {formatFileSize(attachment.size)}
                  </span>
                )}

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRemove(attachment.fileName)}
                  aria-label={t("specificationFiles.remove", { name: attachment.fileName })}
                  className="rounded-full px-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-ink disabled:opacity-50"
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-gray-500">{t("specificationFiles.hint")}</p>
    </div>
  );
}

export default SpecificationFiles;
