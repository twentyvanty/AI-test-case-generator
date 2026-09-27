import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getProject, type Project } from "../services/api";
import { getRequirements, type Requirement } from "../services/requirements";
import RequirementList from "../components/project/RequirementList";
import BackLink from "../components/ui/BackLink";
import ButtonLink from "../components/ui/ButtonLink";
import PageHeader from "../components/ui/PageHeader";
import Spinner from "../components/ui/Spinner";
import { toProjectKey } from "../utils/format";

function ProjectPage() {
  const { t } = useTranslation();
  const projectId = Number(useParams().projectId);
  const [project, setProject] = useState<Project | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([getProject(projectId), getRequirements(projectId)])
      .then(([projectData, requirementData]) => {
        setProject(projectData);
        setRequirements(requirementData);
      })
      .catch((error) => {
        console.error("Failed to load project:", error);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <main className="space-y-5">
      <BackLink to="/workspace">{t("project.backToProjects")}</BackLink>

      {loading && <Spinner label={t("common.loading")} />}

      {error && <p className="text-danger">{t("project.loadError")}</p>}

      {project && (
        <>
          <PageHeader
            eyebrow={toProjectKey(project.name)}
            eyebrowMono
            title={project.name}
            description={project.description}
            actions={
              <ButtonLink to={`/projects/${projectId}/requirements/new`} size="lg">
                + {t("requirements.addTitle")}
              </ButtonLink>
            }
          />

          <RequirementList projectId={projectId} requirements={requirements} />
        </>
      )}
    </main>
  );
}

export default ProjectPage;
