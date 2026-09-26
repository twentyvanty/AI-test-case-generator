import { useRef, useState } from "react";
import { cn } from "../../utils/cn";

type EditableTitleProps = {
  value: string;
  editing: boolean;
  onStartEdit: () => void;
  onSave: (value: string) => void;
  onCancel: () => void;
  className?: string;
};

// Shows a title; while editing, an input that saves on Enter/blur, cancels on Escape
function EditableTitle({
  value,
  editing,
  onStartEdit,
  onSave,
  onCancel,
  className,
}: EditableTitleProps) {
  const [draft, setDraft] = useState(value);
  // Enter/Escape unmount the input, which can fire blur too — only finish once
  const finishedRef = useRef(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          onStartEdit();
        }}
        className={cn("block text-left hover:text-brand-strong", className)}
      >
        {value}
      </button>
    );
  }

  const save = () => {
    if (finishedRef.current) {
      return;
    }

    finishedRef.current = true;

    if (draft.trim()) {
      onSave(draft.trim());
    } else {
      onCancel();
    }
  };

  return (
    <input
      autoFocus
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={(event) => {
        finishedRef.current = false;
        event.target.select();
      }}
      onBlur={save}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          save();
        } else if (event.key === "Escape") {
          finishedRef.current = true;
          onCancel();
        }
      }}
      className={cn(
        "w-full rounded-lg border border-brand bg-white px-2 py-0.5 outline-none ring-2 ring-brand-soft",
        className
      )}
    />
  );
}

export default EditableTitle;
