import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  allCases,
  generateMoreScenarios,
  generateScenarios,
  getRequirement,
  saveRequirement,
  type GenerateOptions,
  type Requirement,
} from "../services/requirements";
import ReviewStep from "../components/requirement/ReviewStep";
import SetupStep from "../components/requirement/SetupStep";
import StepTabs, { STEPS, type Step } from "../components/requirement/StepTabs";
import ValidateStep from "../components/requirement/ValidateStep";
import BackLink from "../components/ui/BackLink";
import Badge from "../components/ui/Badge";
import PageHeader from "../components/ui/PageHeader";
import Spinner from "../components/ui/Spinner";

function RequirementPage() {
  const { t } = useTranslation();
  const params = useParams();
  const projectId = Number(params.projectId);
  const requirementId = params.requirementId ?? "";

  // The current step lives in the URL (?step=review) so refresh/back keep it
  const [searchParams, setSearchParams] = useSearchParams();
  const stepParam = searchParams.get("step");
  const step: Step = STEPS.includes(stepParam as Step) ? (stepParam as Step) : "setup";
  const goToStep = (next: Step) => setSearchParams({ step: next });

  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingMore, setGeneratingMore] = useState(false);

  useEffect(() => {
    getRequirement(projectId, requirementId)
      .then((data) => {
        setRequirement(data);
        setError(data === null);
      })
      .catch((error) => {
        console.error("Failed to load requirement:", error);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [projectId, requirementId]);

  // Update the screen immediately, then save in the background
  const update = (next: Requirement) => {
    setRequirement(next);
    saveRequirement(next).catch((error) =>
      console.error("Failed to save requirement:", error)
    );
  };

  const handleGenerate = async (options: GenerateOptions) => {
    if (!requirement) {
      return;
    }

    try {
      setGenerating(true);
      setRequirement(await generateScenarios(requirement, options));
      goToStep("review");
    } catch (error) {
      console.error("Failed to generate scenarios:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateMore = async () => {
    if (!requirement) {
      return;
    }

    try {
      setGeneratingMore(true);
      setRequirement(await generateMoreScenarios(requirement));
    } catch (error) {
      console.error("Failed to generate more scenarios:", error);
    } finally {
      setGeneratingMore(false);
    }
  };

  const hasScenarios = (requirement?.scenarios.length ?? 0) > 0;
  const hasCases = requirement ? allCases(requirement.scenarios).length > 0 : false;

  const disabledSteps: Step[] = [
    ...(!hasScenarios ? (["review"] as Step[]) : []),
    ...(!hasCases ? (["validate"] as Step[]) : []),
  ];

  // Don't show a step that has nothing in it yet
  const visibleStep = disabledSteps.includes(step) ? "setup" : step;

  const statusBadge = generating ? (
    <Badge tone="info">{t("requirementStatus.generating")}</Badge>
  ) : requirement?.status === "success" ? (
    <Badge tone="success">{t("requirementStatus.success")}</Badge>
  ) : (
    <Badge>{t("requirementStatus.notGenerated")}</Badge>
  );

  return (
    <main className="space-y-5">
      <BackLink to={`/projects/${projectId}`}>{t("requirementPage.backToProject")}</BackLink>

      {loading && <Spinner label={t("common.loading")} />}

      {error && <p className="text-danger">{t("requirementPage.notFound")}</p>}

      {requirement && (
        <>
          <PageHeader
            eyebrow={requirement.id}
            eyebrowMono
            title={requirement.title}
            actions={statusBadge}
          />

          <StepTabs active={visibleStep} onChange={goToStep} disabled={disabledSteps} />

          {visibleStep === "setup" && (
            <SetupStep
              requirement={requirement}
              generating={generating}
              onGenerate={handleGenerate}
            />
          )}

          {visibleStep === "review" && (
            <ReviewStep
              requirement={requirement}
              generatingMore={generatingMore}
              onChange={update}
              onGenerateMore={handleGenerateMore}
              onContinue={() => goToStep("validate")}
            />
          )}

          {visibleStep === "validate" && (
            <ValidateStep
              requirement={requirement}
              onChange={update}
              onBack={() => goToStep("review")}
            />
          )}
        </>
      )}
    </main>
  );
}

export default RequirementPage;
