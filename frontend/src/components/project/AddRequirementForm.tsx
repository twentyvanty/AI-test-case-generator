import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Button from "../ui/Button";
import Card from "../ui/Card";
import CardTitle from "../ui/CardTitle";
import Dropzone from "../ui/Dropzone";
import FieldLabel from "../ui/FieldLabel";

type AddRequirementFormProps = {
  onAdd: (text: string, file: File | null) => Promise<void>;
  onCancel: () => void;
};

function AddRequirementForm({ onAdd, onCancel }: AddRequirementFormProps) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = (text.trim() !== "" || file !== null) && !saving;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    try {
      setSaving(true);
      await onAdd(text, file);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="md">
      <CardTitle>{t("requirements.addTitle")}</CardTitle>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Dropzone file={file} onFileChange={setFile} />

        <div>
          <FieldLabel htmlFor="requirement-text">{t("requirements.text")}</FieldLabel>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="requirement-text"
              autoFocus
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={t("requirements.textPlaceholder")}
              className="min-w-0 flex-1 rounded-full border border-gray-200 bg-white/80 px-4 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
            />

            <div className="flex gap-2">
              <Button type="submit" variant="brand" disabled={!canSubmit}>
                {t("requirements.add")}
              </Button>

              <Button variant="secondary" onClick={onCancel}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
}

export default AddRequirementForm;
