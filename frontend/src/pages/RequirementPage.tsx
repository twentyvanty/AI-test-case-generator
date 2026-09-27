import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  createRequirement,
  deleteRequirement,
  draftScenarios,
  extractText,
  formatRequirementCode,
  getRequirement,
  suggestTechniques,
  TECHNIQUE_KEYS,
  updateRequirement,
  type RequirementDetail,
  type RequirementStatus,
  type TechniqueSuggestion,
} from "../services/requirements";
import RequirementStep, {
  type Busy,
  type RequirementForm,
} from "../components/requirement/RequirementStep";
import ScenarioPreview from "../components/requirement/ScenarioPreview";
import type { Attachment } from "../components/requirement/SpecificationFiles";
import StepTabs from "../components/requirement/StepTabs";
import { isStepUnlocked, STEPS, type Step } from "../components/requirement/steps";
import BackLink from "../components/ui/BackLink";
import Badge, { type BadgeTone } from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import Spinner from "../components/ui/Spinner";

const EMPTY_FORM: RequirementForm = { title: "", text: "", techniques: [] };

const STATUS_TONE: Record<RequirementStatus, BadgeTone> = {
  DRAFT: "neutral",
  SCENARIOS_READY: "info",
  CASES_READY: "info",
  REPORTED: "success",
};

const sameList = (a: string[], b: string[]) =>
  a.length === b.length && a.every((item) => b.includes(item));

// Saved file names are one string: "spec.pdf, rules.docx"
const joinFileNames = (attachments: Attachment[]) =>
  attachments.map((attachment) => attachment.fileName).join(", ").slice(0, 255) || null;

const splitFileNames = (sourceFileName: string | null): Attachment[] =>
  (sourceFileName ?? "")
    .split(", ")
    .filter(Boolean)
    .map((fileName) => ({ fileName, size: null, block: null }));

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

// One page for the whole requirement flow:
//   /projects/:projectId/requirements/new   → step 1 for a new requirement
//   /projects/:projectId/requirements/3     → REQ-0003, step from ?step=
function RequirementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const projectId = Number(params.projectId);
  const number = params.requirementNumber === "new" ? null : Number(params.requirementNumber);

  const [detail, setDetail] = useState<RequirementDetail | null>(null);
  const [form, setForm] = useState<RequirementForm>(EMPTY_FORM);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [readingFiles, setReadingFiles] = useState<string[]>([]);
  const [fileProblems, setFileProblems] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<TechniqueSuggestion[]>([]);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(number !== null);
  const [notFound, setNotFound] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // The requirement on screen. After the first save the URL changes from "new"
  // to the new number — this stops that change from reloading the page.
  const shownNumber = useRef<number | null>(null);

  useEffect(() => {
    if (number === null || number === shownNumber.current) {
      return;
    }

    let cancelled = false;

    getRequirement(projectId, number)
      .then((data) => {
        if (cancelled) {
          return;
        }

        shownNumber.current = data.number;
        setDetail(data);
        setForm({ title: data.title, text: data.text, techniques: data.techniques });
        setAttachments(splitFileNames(data.sourceFileName));
        setSuggestions([]);
      })
      .catch((error) => {
        console.error("Failed to load requirement:", error);

        if (!cancelled) {
          setNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, number]);

  // The current step lives in the URL (?step=scenarios) so refresh/back keep it
  const [searchParams, setSearchParams] = useSearchParams();
  const stepParam = searchParams.get("step") as Step;
  const status = detail?.status ?? null;
  const step: Step =
    STEPS.includes(stepParam) && isStepUnlocked(stepParam, status) ? stepParam : "requirement";
  const goToStep = (next: Step) => setSearchParams({ step: next });

  const sourceFileName = joinFileNames(attachments);
  const isDirty =
    detail === null ||
    form.title.trim() !== detail.title ||
    form.text.trim() !== detail.text ||
    !sameList(form.techniques, detail.techniques) ||
    sourceFileName !== detail.sourceFileName;
  const hasScenarios = (detail?.scenarioCount ?? 0) > 0;

  const changeForm = (changes: Partial<RequirementForm>) =>
    setForm((current) => ({ ...current, ...changes }));

  // Saves the form (create or update) and returns the requirement number
  const save = async () => {
    const input = { ...form, sourceFileName };

    if (!detail) {
      const created = await createRequirement(projectId, input);

      shownNumber.current = created.number;
      setDetail({ ...created, text: form.text.trim(), scenarios: [], latestScenarioRun: null });
      navigate(`/projects/${projectId}/requirements/${created.number}`, { replace: true });

      return created.number;
    }

    if (isDirty) {
      const updated = await updateRequirement(projectId, detail.number, input);
      setDetail((current) => current && { ...current, ...updated, text: form.text.trim() });
    }

    return detail.number;
  };

  // Runs one action with the busy state + error message handled
  const run = async (kind: Exclude<Busy, null>, action: () => Promise<void>) => {
    setBusy(kind);
    setError(null);

    try {
      await action();
    } catch (error) {
      console.error(`Failed (${kind}):`, error);
      setError(errorText(error));
    } finally {
      setBusy(null);
    }
  };

  const handleSave = () =>
    run("saving", async () => {
      await save();
    });

  const handleSuggest = () =>
    run("suggesting", async () => {
      const saved = await save();
      const result = await suggestTechniques(projectId, saved);

      if (result.status === "FAILED" || !result.output) {
        setError(t("requirementPage.aiFailed", { message: result.errorMessage }));
        return;
      }

      const suggested = result.output.suggestions.filter((item) =>
        TECHNIQUE_KEYS.includes(item.technique)
      );

      setSuggestions(suggested);
      changeForm({ techniques: [...new Set(suggested.map((item) => item.technique))] });
    });

  const handleDraft = () =>
    run("drafting", async () => {
      const saved = await save();
      const result = await draftScenarios(projectId, saved);

      if (result.run.status === "FAILED") {
        setDetail((current) => current && { ...current, latestScenarioRun: result.run });
        setError(t("requirementPage.aiFailed", { message: result.run.errorMessage }));
        return;
      }

      setDetail(
        (current) =>
          current && {
            ...current,
            status: "SCENARIOS_READY",
            scenarios: result.scenarios,
            scenarioCount: result.scenarios.length,
            latestScenarioRun: result.run,
          }
      );
      navigate(`/projects/${projectId}/requirements/${saved}?step=scenarios`);
    });

  const handleDelete = () =>
    run("deleting", async () => {
      if (detail) {
        await deleteRequirement(projectId, detail.number);
      }

      navigate(`/projects/${projectId}`);
    });

  // Read the files' text and add it to the details, one block per file
  const handleFiles = async (files: File[]) => {
    const newFiles = files.filter(
      (file) => !attachments.some((attachment) => attachment.fileName === file.name)
    );

    if (newFiles.length === 0) {
      return;
    }

    setReadingFiles(newFiles.map((file) => file.name));
    setFileProblems([]);

    try {
      const documents = await extractText(newFiles);
      const added: Attachment[] = [];
      const problems: string[] = [];
      let text = form.text.trim();

      for (const document of documents) {
        if (!document.text) {
          problems.push(t("specificationFiles.noText", { name: document.fileName }));
          continue;
        }

        const block = `--- from ${document.fileName} ---\n${document.text}`;
        text = text ? `${text}\n\n${block}` : block;
        added.push({ fileName: document.fileName, size: document.size, block });
      }

      setFileProblems(problems);
      setAttachments((current) => [...current, ...added]);
      changeForm({
        text,
        // A new requirement gets the first file's name as its title
        title: form.title || (added[0]?.fileName.replace(/\.[^.]+$/, "") ?? ""),
      });
    } catch (error) {
      console.error("Failed to read files:", error);
      setFileProblems([errorText(error)]);
    } finally {
      setReadingFiles([]);
    }
  };

  // Remove a file, and its text too if the tester hasn't edited that part
  const handleRemoveFile = (fileName: string) => {
    const attachment = attachments.find((item) => item.fileName === fileName);

    if (attachment?.block && form.text.includes(attachment.block)) {
      changeForm({
        text: form.text.replace(attachment.block, "").replace(/\n{3,}/g, "\n\n").trim(),
      });
    }

    setAttachments((current) => current.filter((item) => item.fileName !== fileName));
  };

  const statusBadge =
    busy === "drafting" || busy === "suggesting" ? (
      <Badge tone="info">{t("requirementPage.working")}</Badge>
    ) : status ? (
      <Badge tone={STATUS_TONE[status]}>{t(`requirementStatus.${status}`)}</Badge>
    ) : null;

  const complete = form.title.trim() !== "" && form.text.trim() !== "";
  const locked = busy !== null || readingFiles.length > 0;

  return (
    <main className="space-y-5">
      <BackLink to={`/projects/${projectId}`}>{t("requirementPage.backToProject")}</BackLink>

      {loading && <Spinner label={t("common.loading")} />}

      {notFound && <p className="text-danger">{t("requirementPage.notFound")}</p>}

      {!loading && !notFound && (
        <>
          <PageHeader
            eyebrow={detail ? formatRequirementCode(detail.number) : t("requirementPage.newEyebrow")}
            eyebrowMono={detail !== null}
            title={detail ? detail.title : t("requirementPage.newTitle")}
            description={step === "requirement" ? t("requirementPage.description") : undefined}
            actions={
              <>
                {statusBadge}

                {step === "requirement" && (
                  <Button onClick={handleDraft} disabled={locked || !complete}>
                    {hasScenarios ? t("requirementStep.redraft") : t("requirementStep.draft")}
                    <span aria-hidden="true">→</span>
                  </Button>
                )}
              </>
            }
          />

          <StepTabs active={step} status={status} onChange={goToStep} />

          {step === "requirement" && (
            <RequirementStep
              form={form}
              onChange={changeForm}
              attachments={attachments}
              readingFiles={readingFiles}
              fileProblems={fileProblems}
              onFiles={handleFiles}
              onRemoveFile={handleRemoveFile}
              suggestions={suggestions}
              onSuggest={handleSuggest}
              busy={busy ?? (readingFiles.length > 0 ? "reading" : null)}
              error={error}
              isSaved={detail !== null}
              isDirty={isDirty}
              hasScenarios={hasScenarios}
              textChanged={hasScenarios && detail !== null && form.text.trim() !== detail.text}
              onSave={handleSave}
              onDraft={handleDraft}
              onDelete={() => setConfirmDelete(true)}
            />
          )}

          {step === "scenarios" && detail && (
            <ScenarioPreview scenarios={detail.scenarios} latestRun={detail.latestScenarioRun} />
          )}
        </>
      )}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t("requirementPage.deleteTitle")}
        description={t("requirementPage.deleteDescription", {
          code: detail ? formatRequirementCode(detail.number) : "",
        })}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={busy !== null}>
              {busy === "deleting" ? t("requirementPage.deleting") : t("requirementPage.delete")}
            </Button>
          </>
        }
      />
    </main>
  );
}

export default RequirementPage;
