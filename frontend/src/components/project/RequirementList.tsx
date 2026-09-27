import { useTranslation } from "react-i18next";
import {
  formatRequirementCode,
  type Requirement,
  type RequirementStatus,
} from "../../services/requirements";
import Badge, { type BadgeTone } from "../ui/Badge";
import ButtonLink from "../ui/ButtonLink";
import Card from "../ui/Card";
import CardTitle from "../ui/CardTitle";

const STATUS_TONE: Record<RequirementStatus, BadgeTone> = {
  DRAFT: "neutral",
  SCENARIOS_READY: "info",
  CASES_READY: "info",
  REPORTED: "success",
};

type RequirementListProps = {
  projectId: number;
  requirements: Requirement[];
};

function RequirementList({ projectId, requirements }: RequirementListProps) {
  const { t } = useTranslation();

  return (
    <Card padding="md">
      <CardTitle aside={requirements.length}>{t("requirements.title")}</CardTitle>

      {requirements.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">{t("requirements.empty")}</p>
      ) : (
        <ul className="mt-2 divide-y divide-gray-200/80">
          {requirements.map((requirement) => (
            <li
              key={requirement.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div className="min-w-0">
                <p className="font-mono text-xs text-gray-500">
                  {formatRequirementCode(requirement.number)}
                </p>
                <p className="mt-0.5 font-semibold text-ink">{requirement.title}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <Badge tone={STATUS_TONE[requirement.status]}>
                    {t(`requirementStatus.${requirement.status}`)}
                  </Badge>
                  <span>
                    {t("requirements.scenarioCount", { count: requirement.scenarioCount })}
                  </span>
                </div>
              </div>

              <ButtonLink
                to={`/projects/${projectId}/requirements/${requirement.number}`}
                variant="secondary"
                size="sm"
              >
                {t("requirements.open")} <span aria-hidden="true">→</span>
              </ButtonLink>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default RequirementList;
