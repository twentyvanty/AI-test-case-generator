import { useTranslation } from "react-i18next";
import Card from "../ui/Card";

// A conclusion as text: a finalized version's (read-only), or the live one on
// paper, where a text box would print as an empty frame
export function ConclusionText({ text }: { text: string }) {
  const { t } = useTranslation();

  return text.trim() === "" ? (
    <p className="text-sm italic text-gray-500">{t("report.conclusion.none")}</p>
  ) : (
    <p className="whitespace-pre-line text-sm leading-6 text-gray-800">{text}</p>
  );
}

// The read-only "Conclusion" section of a finalized version
function ConclusionCard({ text }: { text: string }) {
  const { t } = useTranslation();

  return (
    <Card padding="md" className="report-section">
      <h2 className="font-heading text-lg font-semibold tracking-tight text-ink">{t("report.conclusion.title")}</h2>
      <div className="mt-3">
        <ConclusionText text={text} />
      </div>
    </Card>
  );
}

export default ConclusionCard;
