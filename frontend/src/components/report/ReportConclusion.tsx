import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "../../services/http";
import { finalizeReport, saveConclusion, type LiveReport } from "../../services/report";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Modal from "../ui/Modal";
import { ConclusionText } from "./ConclusionText";
import { formatDay, verdictReasonText } from "./reportLabels";

// Saved this long after the tester stops typing
const SAVE_AFTER_MS = 1000;
const MAX_LENGTH = 5000;

type SaveState = "idle" | "saving" | "saved" | "error";

type ReportConclusionProps = {
  projectId: number;
  requirementNumber: number;
  report: LiveReport;
  // The report after a save or finalize (changedSinceFinalized, finalized…)
  onReport: (report: LiveReport) => void;
  // Finalized: the requirement is now REPORTED
  onFinalized: () => void;
  // After a 409: true when a running generation is the reason (the page then
  // shows "Still generating…" instead of an error)
  onConflict?: () => Promise<boolean>;
};

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

// The tester's conclusion and "Finalize report" (D-040). The placeholder asks
// for what the report leaves to the tester (ISO/IEC/IEEE 29119-3 and ISTQB):
// the assessment, what blocked testing, and lessons learned.
function ReportConclusion({
  projectId,
  requirementNumber,
  report,
  onReport,
  onFinalized,
  onConflict,
}: ReportConclusionProps) {
  const { t, i18n } = useTranslation();
  const fieldId = useId();
  const [text, setText] = useState(report.conclusion);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [finalizing, setFinalizing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A save waiting for the tester to stop typing, and the text it will send
  const timer = useRef<number | null>(null);
  const pending = useRef<string | null>(null);
  // Only the newest save's answer is used (an older one can arrive later)
  const saveNumber = useRef(0);

  const save = async (value: string) => {
    const number = ++saveNumber.current;
    pending.current = null;
    setSaveState("saving");

    try {
      const fresh = await saveConclusion(projectId, requirementNumber, value);

      if (number === saveNumber.current) {
        onReport(fresh);
        setSaveState("saved");
      }
    } catch (failure) {
      console.error("Failed to save the conclusion:", failure);

      if (number === saveNumber.current) {
        setSaveState("error");
      }
    }
  };

  const change = (value: string) => {
    setText(value);
    setNotice(null);
    pending.current = value;

    if (timer.current !== null) {
      window.clearTimeout(timer.current);
    }

    timer.current = window.setTimeout(() => {
      timer.current = null;
      void save(value);
    }, SAVE_AFTER_MS);
  };

  // Leaving the step before the save ran: send it anyway
  useEffect(
    () => () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }

      if (pending.current !== null) {
        void saveConclusion(projectId, requirementNumber, pending.current).catch((failure) =>
          console.error("Failed to save the conclusion:", failure)
        );
      }
    },
    [projectId, requirementNumber]
  );

  const notReady = report.summary.verdict.value === "NOT_READY";

  const finalize = async () => {
    setConfirming(false);
    setError(null);
    setNotice(null);
    setFinalizing(true);

    // The text on screen goes with the request; a waiting save isn't needed
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }

    pending.current = null;
    saveNumber.current++;

    try {
      const fresh = await finalizeReport(projectId, requirementNumber, { conclusion: text, acceptOpenRisks: notReady });

      onReport(fresh);
      onFinalized();
      setSaveState("saved");
      setNotice(t("report.conclusion.finalized", { version: fresh.finalized?.version ?? 1 }));
    } catch (failure) {
      console.error("Failed to finalize the report:", failure);

      const elsewhere =
        failure instanceof ApiError && failure.status === 409 && onConflict && (await onConflict().catch(() => false));

      if (!elsewhere) {
        setError(errorText(failure));
      }
    } finally {
      setFinalizing(false);
    }
  };

  const saveNote =
    saveState === "saving"
      ? t("report.conclusion.saving")
      : saveState === "saved"
        ? t("report.conclusion.saved")
        : saveState === "error"
          ? t("report.conclusion.saveError")
          : null;

  return (
    <Card padding="md" className="report-section">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={fieldId} className="font-heading text-lg font-semibold tracking-tight text-ink">
          {t("report.conclusion.title")}
        </label>
        {saveNote && (
          <span
            role="status"
            className={`text-xs ${saveState === "error" ? "text-danger" : "text-gray-500"} print:hidden`}
          >
            {saveNote}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-sm text-gray-500 print:hidden">{t("report.conclusion.description")}</p>

      <textarea
        id={fieldId}
        value={text}
        maxLength={MAX_LENGTH}
        rows={5}
        onChange={(event) => change(event.target.value)}
        placeholder={t("report.conclusion.placeholder")}
        className="mt-3 w-full resize-y print:hidden rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
      />

      {/* On paper: the text itself, not an empty-looking text box */}
      <div className="mt-3 hidden print:block">
        <ConclusionText text={text} />
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {notice && (
        <p role="status" className="mt-3 rounded-xl print:hidden bg-success/10 px-3 py-2 text-sm text-success">
          {notice}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-xs text-gray-500">
          {report.finalized
            ? t("report.conclusion.lastFinalized", {
                version: report.finalized.version,
                date: formatDay(report.finalized.finalizedAt, i18n.language),
                verdict: t(`report.verdict.${report.finalized.verdict}`),
              })
            : t("report.conclusion.notFinalized")}
        </p>

        <Button
          variant="brand"
          onClick={() => (notReady ? setConfirming(true) : void finalize())}
          disabled={finalizing}
        >
          {finalizing ? t("report.conclusion.finalizing") : t("report.conclusion.finalize")}
        </Button>
      </div>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={t("report.conclusion.confirmTitle")}
        description={t("report.conclusion.confirmText")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="brand" onClick={() => void finalize()} disabled={finalizing}>
              {t("report.conclusion.confirmButton")}
            </Button>
          </>
        }
      >
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          {report.summary.verdict.reasons.map((reason) => (
            <li key={reason.code}>{verdictReasonText(reason, t)}</li>
          ))}
        </ul>
      </Modal>
    </Card>
  );
}

export default ReportConclusion;
