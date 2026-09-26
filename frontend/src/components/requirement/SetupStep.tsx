import { useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  AiModule,
  GenerateOptions,
  Requirement,
  TechniqueChoice,
} from "../../services/requirements";
import { cn } from "../../utils/cn";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Dropzone from "../ui/Dropzone";
import FieldLabel from "../ui/FieldLabel";

const TECHNIQUES: TechniqueChoice[] = [
  "boundaryValue",
  "equivalencePartitioning",
  "decisionTable",
  "stateTransition",
  "aiChoose",
];

const AI_MODULES: AiModule[] = ["local", "cloud", "auto"];

type SetupStepProps = {
  requirement: Requirement;
  generating: boolean;
  onGenerate: (options: GenerateOptions) => void;
};

function SetupStep({ requirement, generating, onGenerate }: SetupStepProps) {
  const { t } = useTranslation();
  const [text, setText] = useState(requirement.text);
  const [file, setFile] = useState<File | null>(null);
  const [techniques, setTechniques] = useState<TechniqueChoice[]>(requirement.techniques);
  const [aiModule, setAiModule] = useState<AiModule>(requirement.aiModule);

  const toggleTechnique = (technique: TechniqueChoice) => {
    setTechniques((current) =>
      current.includes(technique)
        ? current.filter((item) => item !== technique)
        : [...current, technique]
    );
  };

  const canGenerate = text.trim() !== "" && techniques.length > 0 && !generating;

  return (
    <Card padding="md" className="space-y-5">
      <div>
        <FieldLabel htmlFor="setup-text">{t("requirements.text")}</FieldLabel>
        <textarea
          id="setup-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={5}
          placeholder={t("requirements.textPlaceholder")}
          className="mt-2 w-full resize-y rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 text-sm leading-6 outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
        />
      </div>

      <Dropzone file={file} onFileChange={setFile} />

      <p className="text-sm text-gray-600">{t("setup.hint")}</p>

      <div>
        <FieldLabel>{t("setup.technique")}</FieldLabel>
        <div className="mt-2 flex flex-wrap gap-2">
          {TECHNIQUES.map((technique) => {
            const selected = techniques.includes(technique);

            return (
              <button
                key={technique}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleTechnique(technique)}
                className={cn(
                  "rounded-full px-3 py-1 text-sm transition",
                  selected
                    ? "bg-brand-strong font-medium text-white"
                    : "border border-gray-200 bg-white/80 text-gray-700 hover:bg-white"
                )}
              >
                {t(`techniques.${technique}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel>{t("setup.aiModule")}</FieldLabel>
        <div role="radiogroup" className="mt-2 grid gap-2 sm:grid-cols-3">
          {AI_MODULES.map((module) => {
            const selected = aiModule === module;

            return (
              <button
                key={module}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setAiModule(module)}
                className={cn(
                  "rounded-2xl border bg-white/80 px-4 py-3 text-left transition",
                  selected
                    ? "border-brand-strong ring-1 ring-brand-strong"
                    : "border-gray-200 hover:bg-white"
                )}
              >
                <p className="text-sm font-medium text-ink">
                  {t(`aiModules.${module}.name`)}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {t(`aiModules.${module}.description`)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={!canGenerate}
        onClick={() => onGenerate({ text, techniques, aiModule })}
      >
        {generating ? t("setup.generating") : t("setup.generate")}
      </Button>
    </Card>
  );
}

export default SetupStep;
