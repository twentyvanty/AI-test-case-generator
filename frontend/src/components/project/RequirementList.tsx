import { useTranslation } from "react-i18next";
import {
  allCases,
  summarizeCoverage,
  type Requirement,
} from "../../services/requirements";
import ButtonLink from "../ui/ButtonLink";
import Card from "../ui/Card";
import CardTitle from "../ui/CardTitle";

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
                <p className="font-mono text-xs text-gray-500">{requirement.id}</p>
                <p className="mt-0.5 font-semibold text-ink">{requirement.title}</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {t("requirements.caseCount", {
                    count: allCases(requirement.scenarios).length,
                  })}
                  {" · "}
                  {t("requirements.coverage", {
                    percent: summarizeCoverage(requirement.scenarios).percent,
                  })}
                </p>
              </div>

              <ButtonLink
                to={`/projects/${projectId}/requirements/${requirement.id}`}
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
