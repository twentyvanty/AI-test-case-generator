import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getProject, type Project } from "../services/api";
import {
  addRequirement,
  getRequirements,
  summarizeCoverage,
  type Requirement,
} from "../services/requirements";
import CoverageReport from "../components/coverage/CoverageReport";
import AddRequirementForm from "../components/project/AddRequirementForm";
import RequirementList from "../components/project/RequirementList";
import BackLink from "../components/ui/BackLink";
import Button from "../components/ui/Button";
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
  const [showAddForm, setShowAddForm] = useState(false);

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

  const handleAdd = async (text: string, file: File | null) => {
    // TODO: upload and parse the file once the backend supports it.
    // For now a file-only requirement is titled after the file name.
    const content = text.trim() || file?.name.replace(/\.[^.]+$/, "") || "";
    const requirement = await addRequirement(projectId, content);

    setRequirements((current) => [...current, requirement]);
    setShowAddForm(false);
  };

  // Scenario ids repeat between requirements (SC-01…), so prefix them
  const projectCoverage = summarizeCoverage(
    requirements.flatMap((requirement) =>
      requirement.scenarios.map((scenario) => ({
        ...scenario,
        id: `${requirement.id}/${scenario.id}`,
      }))
    )
  );

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
              !showAddForm && (
                <Button size="lg" onClick={() => setShowAddForm(true)}>
                  + {t("requirements.addTitle")}
                </Button>
              )
            }
          />

          {showAddForm && (
            <AddRequirementForm
              onAdd={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          <RequirementList projectId={projectId} requirements={requirements} />

          <CoverageReport
            title={t("coverage.title")}
            coverage={projectCoverage}
          />
        </>
      )}
    </main>
  );
}

export default ProjectPage;
