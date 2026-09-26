import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import { getProjects, createProject, type Project } from "../services/api";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import Spinner from "../components/ui/Spinner";
import { TextArea, TextInput } from "../components/ui/TextField";

function DashboardPage() {
  const { username } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error("Failed to load projects:", error);
        setError(t("dashboard.loadError"));
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [t]);

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      return;
    }

    try {
      setCreating(true);

      const newProject = await createProject(
        projectName.trim(),
        projectDescription.trim()
      );

      setProjects((currentProjects) => [
        newProject,
        ...currentProjects,
      ]);

      setProjectName("");
      setProjectDescription("");
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-8 py-8">
        <Spinner label={t("common.loading")} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-8 py-8">
        <p className="text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-8 py-8">

      {/* Welcome Section */}
      <section className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            {t("dashboard.welcome", { username })}
          </h1>

          <p className="mt-2 text-gray-500">
            {t("dashboard.subtitle")}
          </p>
        </div>

        <Button size="lg" onClick={() => setShowCreateModal(true)}>
          {t("dashboard.newProject")}
        </Button>
      </section>

      {/* Projects Section */}
      <section>

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t("dashboard.yourProjects")}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {t("dashboard.projectsDescription")}
            </p>
          </div>

          <span className="text-sm text-gray-400">
            {t("dashboard.projectCount", { count: projects.length })}
          </span>
        </div>

        {/* Project Cards */}
        <div className="grid gap-5 md:grid-cols-2">

          {projects.map((project) => (
            <Card key={project.id}>
              <h2 className="text-lg font-semibold text-gray-900">
                {project.name}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                {project.description || t("dashboard.noDescription")}
              </p>

              <Button
                className="mt-4"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                {t("common.open")}
              </Button>
            </Card>
          ))}

        </div>

      </section>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t("project.createTitle")}
        description={t("project.createDescription")}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowCreateModal(false)}
            >
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
      </Modal>

    </main>
  );
}

export default DashboardPage;
