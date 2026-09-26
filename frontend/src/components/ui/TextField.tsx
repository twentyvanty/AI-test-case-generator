import { useId } from "react";
import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "../../utils/cn";

const fieldClasses =
  "mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500";

const labelClasses = "text-sm font-medium text-gray-700";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function TextInput({ label, className, id, ...props }: TextInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={className}>
      <label htmlFor={inputId} className={labelClasses}>
        {label}
      </label>

      <input id={inputId} type="text" className={fieldClasses} {...props} />
    </div>
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export function TextArea({ label, className, id, ...props }: TextAreaProps) {
  const generatedId = useId();
  const textAreaId = id ?? generatedId;

  return (
    <div className={className}>
      <label htmlFor={textAreaId} className={labelClasses}>
        {label}
      </label>

      <textarea
        id={textAreaId}
        className={cn(fieldClasses, "resize-none")}
        {...props}
      />
    </div>
  );
}
