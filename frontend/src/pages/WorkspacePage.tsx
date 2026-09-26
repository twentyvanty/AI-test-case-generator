import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getProjects, createProject, type Project } from "../services/api";
import { getRequirements, summarizeCoverage } from "../services/requirements";
import ProjectCard from "../components/workspace/ProjectCard";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import Spinner from "../components/ui/Spinner";
import { TextArea, TextInput } from "../components/ui/TextField";

type ProjectStats = {
  requirementCount: number;
  coveragePercent: number;
};

async function loadStats(project: Project): Promise<ProjectStats> {
  const requirements = await getRequirements(project.id);

  return {
    requirementCount: requirements.length,
    coveragePercent: summarizeCoverage(
      requirements.flatMap((requirement) => requirement.scenarios)
    ).percent,
  };
}

function WorkspacePage() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Record<number, ProjectStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getProjects();
        const statsList = await Promise.all(data.map(loadStats));

        setProjects(data);
        setStats(
          Object.fromEntries(data.map((project, index) => [project.id, statsList[index]]))
        );
      } catch (error) {
        console.error("Failed to load projects:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const closeModal = () => {
    setShowCreateModal(false);
    setCreateError(false);
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      return;
    }

    try {
      setCreating(true);
      setCreateError(false);

      const newProject = await createProject(
        projectName.trim(),
        projectDescription.trim()
      );

      setProjects((current) => [newProject, ...current]);
      setStats((current) => ({
        ...current,
        [newProject.id]: { requirementCount: 0, coveragePercent: 0 },
      }));

      setProjectName("");
      setProjectDescription("");
      closeModal();
    } catch (error) {
      console.error("Failed to create project:", error);
      setCreateError(true);
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="space-y-5">
      <PageHeader
        eyebrow={t("nav.workspace")}
        title={t("workspace.title")}
        actions={
          <Button size="lg" onClick={() => setShowCreateModal(true)}>
            + {t("workspace.newProject")}
          </Button>
        }
      />

      {loading && <Spinner label={t("common.loading")} />}

      {error && <p className="text-danger">{t("workspace.loadError")}</p>}

      {!loading && !error && projects.length === 0 && (
        <Card padding="md" className="py-12 text-center">
          <p className="font-heading text-lg font-semibold text-ink">
            {t("workspace.emptyTitle")}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {t("workspace.emptyDescription")}
          </p>
        </Card>
      )}

      {projects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              requirementCount={stats[project.id]?.requirementCount ?? 0}
              coveragePercent={stats[project.id]?.coveragePercent ?? 0}
            />
          ))}
        </div>
      )}

      <Modal
        open={showCreateModal}
        onClose={closeModal}
        title={t("project.createTitle")}
        description={t("project.createDescription")}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>
              {t("common.cancel")}
            </Button>

            <Button
              onClick={handleCreateProject}
              disabled={creating || !projectName.trim()}
            >
              {creating ? t("project.creating") : t("project.createProject")}
            </Button>
          </>
        }
      >
        <TextInput
          label={t("project.projectName")}
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder={t("project.projectNamePlaceholder")}
        />

        <TextArea
          className="mt-4"
          label={t("project.description")}
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          placeholder={t("project.descriptionPlaceholder")}
          rows={4}
        />

        {createError && (
          <p className="mt-3 text-sm text-danger">{t("project.createError")}</p>
        )}
      </Modal>
    </main>
  );
}

export default WorkspacePage;
