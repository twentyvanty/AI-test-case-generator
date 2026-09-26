import { useTranslation } from "react-i18next";
import type { Project } from "../../services/api";
import { formatRelativeTime, toProjectKey } from "../../utils/format";
import ButtonLink from "../ui/ButtonLink";
import Card from "../ui/Card";

type ProjectCardProps = {
  project: Project;
  requirementCount: number;
  coveragePercent: number;
};

function ProjectCard({ project, requirementCount, coveragePercent }: ProjectCardProps) {
  const { t, i18n } = useTranslation();

  return (
    <Card padding="md" className="flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs text-gray-500">
            {toProjectKey(project.name)}
          </p>

          <h2 className="mt-1 font-heading text-lg font-semibold tracking-tight text-ink">
            {project.name}
          </h2>
        </div>

        <span className="font-heading text-xl font-semibold text-brand-strong">
          {coveragePercent}%
        </span>
      </div>

      <p className="mt-1.5 flex-1 text-sm text-gray-500">
        {project.description || t("workspace.noDescription")}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/80 pt-4">
        <span className="text-sm text-gray-500">
          {t("workspace.requirementCount", { count: requirementCount })}
          {" · "}
          {t("workspace.updated", {
            time: formatRelativeTime(project.updatedAt, i18n.language),
          })}
        </span>

        <ButtonLink to={`/projects/${project.id}`} variant="secondary" size="sm">
          {t("workspace.openProject")} <span aria-hidden="true">→</span>
        </ButtonLink>
      </div>
    </Card>
  );
}

export default ProjectCard;
